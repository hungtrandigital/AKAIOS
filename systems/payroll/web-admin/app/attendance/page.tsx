'use client'

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, apiFetch } from '@/lib/api'
import { TopNav } from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'
import { AttendanceOverrideModal } from '@/components/AttendanceOverrideModal'
import { formatVietnamLongDate, getVietnamDateKey } from '@/lib/vietnam-date'

interface AttendanceRecord {
  id: string
  status: string
  checkInAt: string | null
  checkOutAt: string | null
  totalMinutesWorked: number | null
  overtimeMinutes: number | null
  overrideById: string | null
  overrideReason: string | null
  shiftAssignment: {
    employee: { employeeCode: string; fullName: string }
    project: { code: string; name: string }
    shift: { name: string; startTime: string; endTime: string }
    date: string
  }
}

interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  breakMinutes: number
  lateThresholdMinutes: number
  isOvernight: boolean
  color?: string | null
}

interface Employee {
  id: string
  employeeCode: string
  fullName: string
}

interface Project {
  id: string
  code: string
  name: string
}

interface ShiftAssignment {
  id: string
  date: string
  status: 'scheduled' | 'checked_in' | 'checked_out' | 'completed' | 'missed' | 'cancelled'
  notes: string | null
  employee: Employee
  project: Project
  shift: Shift
  attendanceRecord: {
    id?: string
    checkInAt: string | null
    checkOutAt: string | null
    overrideById?: string | null
    overrideReason?: string | null
  } | null
}

interface AssignmentResponse {
  data: ShiftAssignment[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  summary: Record<ShiftAssignment['status'], number>
}

interface ScheduleWarning {
  type: 'time_overlap' | 'same_day_multiple_shift'
  employeeId: string
  date: string
  shiftId: string
  conflictCount: number
  message: string
}

interface CopyPreviewItem {
  sourceAssignmentId: string
  sourceDate: string
  targetDate: string
  employee: Employee
  shift: Shift
  notes: string | null
  warnings: ScheduleWarning[]
  blockingReasons: string[]
}

interface CopyPreview {
  previewToken: string
  projectId: string
  sourceFrom: string
  sourceTo: string
  targetFrom: string
  targetTo: string
  items: CopyPreviewItem[]
  summary: { total: number; warningCount: number; blockingCount: number }
}

const COPY_BLOCKER_LABELS: Record<string, string> = {
  exact_duplicate: 'Trùng hoàn toàn với lịch hiện có.',
  employee_inactive: 'Nhân viên không còn hoạt động.',
  shift_inactive: 'Khung giờ không còn hoạt động.',
  outside_contract: 'Ngày đích nằm ngoài thời hạn dự án.',
}

const ATTENDANCE_STATUS: Record<string, { label: string; cls: string }> = {
  present: { label: 'Đúng giờ', cls: 'badge-success' },
  late: { label: 'Đi trễ', cls: 'badge-warning' },
  absent: { label: 'Vắng', cls: 'badge-danger' },
  on_leave: { label: 'Nghỉ phép', cls: 'badge-neutral' },
  holiday: { label: 'Lễ', cls: 'badge-info' },
  half_day: { label: 'Nửa ngày', cls: 'badge-warning' },
  early_leave: { label: 'Về sớm', cls: 'badge-warning' },
}

const ASSIGNMENT_STATUS: Record<ShiftAssignment['status'], { label: string; cls: string }> = {
  scheduled: { label: 'Đã xếp ca', cls: 'badge-info' },
  checked_in: { label: 'Đang làm', cls: 'badge-success' },
  checked_out: { label: 'Đã ra ca', cls: 'badge-dark' },
  completed: { label: 'Đã chốt', cls: 'badge-dark' },
  missed: { label: 'Vắng ca', cls: 'badge-danger' },
  cancelled: { label: 'Đã hủy', cls: 'badge-neutral' },
}

function timeLabel(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function readableError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Tài khoản không có quyền thao tác với lịch ca này.'
    if (error.status === 404) return 'Không tìm thấy nhân viên, dự án hoặc ca trong phạm vi được phép.'
    if (error.status === 409) return error.message
    if (error.status === 422) return 'Không thể thực hiện vì dữ liệu lịch không còn hợp lệ.'
    return error.message
  }
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('409')) return 'Nhân viên đã có ca trùng hoặc lịch này đã tồn tại.'
  if (message.includes('422')) return 'Không thể thực hiện vì ca đã phát sinh điểm danh hoặc không còn hợp lệ.'
  if (message.includes('403')) return 'Tài khoản không có quyền thao tác với lịch ca này.'
  if (message.includes('404')) return 'Không tìm thấy nhân viên, dự án hoặc ca trong phạm vi được phép.'
  return message
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const last = new Date(Date.UTC(year!, monthNumber!, 0)).getUTCDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` }
}

function previousMonthBounds(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const previous = new Date(Date.UTC(year!, monthNumber! - 2, 1))
  const key = `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, '0')}`
  return monthBounds(key)
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('vi-VN', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
}

export default function AttendancePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const today = getVietnamDateKey()
  const canSchedule = ['bo_admin', 'system_admin', 'supervisor'].includes(user?.role ?? '')
  const canCreateTemplate = ['bo_admin', 'system_admin'].includes(user?.role ?? '')
  const canManualAttendance = ['system_admin', 'supervisor'].includes(user?.role ?? '')

  const [activeTab, setActiveTab] = useState<'attendance' | 'schedule'>('attendance')
  const [overrideTarget, setOverrideTarget] = useState<AttendanceRecord | null>(null)
  const [attendanceFilter, setAttendanceFilter] = useState('')

  const [scheduleDate, setScheduleDate] = useState(today)
  const [scheduleMonth, setScheduleMonth] = useState(today.slice(0, 7))
  const [projectFilter, setProjectFilter] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [schedulePage, setSchedulePage] = useState(1)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [assignmentEmployeeId, setAssignmentEmployeeId] = useState('')
  const [assignmentProjectId, setAssignmentProjectId] = useState('')
  const [assignmentShiftId, setAssignmentShiftId] = useState('')
  const [assignmentNotes, setAssignmentNotes] = useState('')
  const [assignmentWarnings, setAssignmentWarnings] = useState<ScheduleWarning[]>([])
  const [assignmentConflictToken, setAssignmentConflictToken] = useState('')
  const initialPreviousMonth = previousMonthBounds(today.slice(0, 7))
  const [copySourceFrom, setCopySourceFrom] = useState(initialPreviousMonth.from)
  const [copySourceTo, setCopySourceTo] = useState(initialPreviousMonth.to)
  const [copyTargetStart, setCopyTargetStart] = useState(`${today.slice(0, 7)}-01`)
  const [copyRequestId, setCopyRequestId] = useState('')
  const [cancelTarget, setCancelTarget] = useState<ShiftAssignment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [manualTarget, setManualTarget] = useState<ShiftAssignment | null>(null)
  const [manualEvent, setManualEvent] = useState<'check_in' | 'check_out'>('check_in')
  const [manualOccurredAt, setManualOccurredAt] = useState('')
  const [manualReasonCode, setManualReasonCode] = useState<'capture_unavailable' | 'permission_blocked' | 'device_failure'>('device_failure')
  const [manualReason, setManualReason] = useState('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [templateName, setTemplateName] = useState('')
  const [templateStart, setTemplateStart] = useState('08:00')
  const [templateEnd, setTemplateEnd] = useState('17:00')
  const [templateBreak, setTemplateBreak] = useState('60')
  const [templateLate, setTemplateLate] = useState('15')
  const [templateColor, setTemplateColor] = useState('#0289f7')
  const attendanceTabRef = useRef<HTMLButtonElement>(null)
  const scheduleTabRef = useRef<HTMLButtonElement>(null)
  const cancelDialogRef = useRef<HTMLFormElement>(null)
  const cancelReasonRef = useRef<HTMLTextAreaElement>(null)
  const cancelReturnFocusRef = useRef<HTMLButtonElement | null>(null)
  const manualDialogRef = useRef<HTMLFormElement>(null)
  const manualReasonRef = useRef<HTMLTextAreaElement>(null)
  const manualReturnFocusRef = useRef<HTMLButtonElement | null>(null)
  const selectedMonth = useMemo(() => monthBounds(scheduleMonth), [scheduleMonth])

  const attendanceQuery = useQuery({
    queryKey: ['attendance', today],
    queryFn: () => apiFetch<{ data: AttendanceRecord[] }>('/attendance/records', {
      query: { from: today, to: today },
    }),
    refetchInterval: activeTab === 'attendance' ? 30_000 : false,
  })

  const shiftsQuery = useQuery({
    queryKey: ['shifts'],
    queryFn: () => apiFetch<{ data: Shift[] }>('/attendance/shifts'),
    enabled: canSchedule && activeTab === 'schedule',
  })
  const projectsQuery = useQuery({
    queryKey: ['schedule-projects'],
    queryFn: () => apiFetch<{ data: Project[] }>('/attendance/projects', { query: { status: 'active' } }),
    enabled: canSchedule && activeTab === 'schedule',
  })
  const employeesQuery = useQuery({
    queryKey: ['schedule-employees', employeeSearch],
    queryFn: () => apiFetch<{ data: Employee[] }>('/attendance/employees', {
      query: { status: 'active', search: employeeSearch.trim() || undefined, limit: 100 },
    }),
    enabled: canSchedule && activeTab === 'schedule',
  })
  const assignmentsQuery = useQuery({
    queryKey: ['shift-assignments', scheduleMonth, projectFilter, employeeFilter, statusFilter, schedulePage],
    queryFn: () => apiFetch<AssignmentResponse>('/attendance/shifts/assignments', {
      query: {
        from: selectedMonth.from,
        to: selectedMonth.to,
        projectId: projectFilter,
        employeeId: employeeFilter || undefined,
        status: statusFilter || undefined,
        page: schedulePage,
        limit: 50,
      },
    }),
    enabled: canSchedule && activeTab === 'schedule' && Boolean(projectFilter),
    refetchInterval: activeTab === 'schedule' ? 30_000 : false,
  })

  const createAssignment = useMutation({
    mutationFn: (confirmConflicts: boolean) => apiFetch<ShiftAssignment & { warnings?: ScheduleWarning[] }>('/attendance/shifts/assignments', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: assignmentEmployeeId,
        projectId: assignmentProjectId,
        shiftId: assignmentShiftId,
        date: scheduleDate,
        notes: assignmentNotes.trim() || undefined,
        confirmConflicts,
        conflictToken: confirmConflicts ? assignmentConflictToken : undefined,
      }),
    }),
    onSuccess: async (assignment) => {
      const warningText = assignment.warnings?.length
        ? ' Ca có xung đột đã được xác nhận và lưu audit.'
        : ''
      setNotice({ type: 'success', text: `Đã xếp ca và ghi nhận lịch sử thao tác.${warningText}` })
      setAssignmentEmployeeId('')
      setAssignmentNotes('')
      setAssignmentWarnings([])
      setAssignmentConflictToken('')
      await queryClient.invalidateQueries({ queryKey: ['shift-assignments'] })
    },
    onError: (error) => {
      if (
        error instanceof ApiError
        && (error.details?.requiresConfirmation || error.details?.reconfirmRequired)
      ) {
        setAssignmentWarnings((error.details.warnings as ScheduleWarning[] | undefined) ?? [])
        setAssignmentConflictToken(
          typeof error.details.conflictToken === 'string' ? error.details.conflictToken : '',
        )
        setNotice({
          type: 'error',
          text: error.details.reconfirmRequired
            ? 'Lịch đã thay đổi trong lúc xác nhận. Vui lòng kiểm tra trạng thái mới rồi thao tác lại.'
            : 'Lịch có xung đột. Kiểm tra cảnh báo và xác nhận nếu vẫn muốn lưu.',
        })
        return
      }
      setNotice({ type: 'error', text: readableError(error) })
    },
  })

  const copyPreview = useMutation({
    mutationFn: () => apiFetch<CopyPreview>('/attendance/shifts/assignments/copy-preview', {
      method: 'POST',
      body: JSON.stringify({
        projectId: projectFilter,
        sourceFrom: copySourceFrom,
        sourceTo: copySourceTo,
        targetStart: copyTargetStart,
      }),
    }),
    onSuccess: () => {
      setCopyRequestId(crypto.randomUUID())
      setNotice(null)
    },
    onError: (error) => setNotice({ type: 'error', text: readableError(error) }),
  })

  const copySchedule = useMutation({
    mutationFn: (confirmConflicts: boolean) => apiFetch<{ assignments: ShiftAssignment[] }>('/attendance/shifts/assignments/copy', {
      method: 'POST',
      body: JSON.stringify({
        projectId: projectFilter,
        sourceFrom: copySourceFrom,
        sourceTo: copySourceTo,
        targetStart: copyTargetStart,
        requestId: copyRequestId,
        previewToken: copyPreview.data!.previewToken,
        confirmConflicts,
      }),
    }),
    onSuccess: async (result) => {
      setNotice({ type: 'success', text: `Đã copy ${result.assignments.length} lịch và lưu audit.` })
      copyPreview.reset()
      setCopyRequestId('')
      await queryClient.invalidateQueries({ queryKey: ['shift-assignments'] })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.details?.repreviewRequired) {
        copyPreview.reset()
        setCopyRequestId('')
        setNotice({ type: 'error', text: 'Lịch đã thay đổi sau khi xem trước. Vui lòng xem trước lại trước khi copy.' })
        return
      }
      setNotice({ type: 'error', text: readableError(error) })
    },
  })

  const createTemplate = useMutation({
    mutationFn: () => apiFetch<Shift>('/attendance/shifts', {
      method: 'POST',
      body: JSON.stringify({
        name: templateName.trim(),
        startTime: templateStart,
        endTime: templateEnd,
        breakMinutes: Number(templateBreak),
        lateThresholdMinutes: Number(templateLate),
        isOvernight: templateEnd < templateStart,
        color: templateColor,
      }),
    }),
    onSuccess: async (shift) => {
      setNotice({ type: 'success', text: `Đã tạo mẫu ca “${shift.name}”.` })
      setTemplateName('')
      setAssignmentShiftId(shift.id)
      await queryClient.invalidateQueries({ queryKey: ['shifts'] })
    },
    onError: (error) => setNotice({ type: 'error', text: readableError(error) }),
  })

  const cancelAssignment = useMutation({
    mutationFn: () => apiFetch<ShiftAssignment>(`/attendance/shifts/assignments/${cancelTarget!.id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: cancelReason.trim() }),
    }),
    onSuccess: async () => {
      setNotice({ type: 'success', text: 'Đã hủy ca và lưu lý do vào nhật ký.' })
      closeCancellation()
      await queryClient.invalidateQueries({ queryKey: ['shift-assignments'] })
    },
    onError: (error) => setNotice({ type: 'error', text: readableError(error) }),
  })

  const recordManualAttendance = useMutation({
    mutationFn: () => apiFetch<AttendanceRecord>(`/attendance/assignments/${manualTarget!.id}/manual-event`, {
      method: 'POST',
      body: JSON.stringify({
        event: manualEvent,
        occurredAt: new Date(manualOccurredAt).toISOString(),
        reasonCode: manualReasonCode,
        reason: manualReason.trim(),
      }),
    }),
    onSuccess: async () => {
      setNotice({ type: 'success', text: manualEvent === 'check_in' ? 'Đã ghi nhận vào ca thủ công và lưu audit.' : 'Đã ghi nhận ra ca thủ công và lưu audit.' })
      closeManualAttendance(true)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['shift-assignments'] }),
        queryClient.invalidateQueries({ queryKey: ['attendance'] }),
      ])
    },
    onError: (error) => setNotice({ type: 'error', text: readableError(error) }),
  })

  const groupedByProject = (attendanceQuery.data?.data ?? []).reduce((acc, record) => {
    const key = record.shiftAssignment.project.code
    if (!acc[key]) acc[key] = { project: record.shiftAssignment.project, records: [] as AttendanceRecord[] }
    acc[key]!.records.push(record)
    return acc
  }, {} as Record<string, { project: AttendanceRecord['shiftAssignment']['project']; records: AttendanceRecord[] }>)

  const filteredAttendance = Object.entries(groupedByProject).filter(([code, group]) => {
    if (!attendanceFilter) return true
    const query = attendanceFilter.toLowerCase()
    return code.toLowerCase().includes(query) || group.project.name.toLowerCase().includes(query)
  })

  const assignments = useMemo(() => assignmentsQuery.data?.data ?? [], [assignmentsQuery.data?.data])
  const copyProblemItems = useMemo(
    () => (copyPreview.data?.items ?? []).filter((item) => (
      item.warnings.length > 0 || item.blockingReasons.length > 0
    )),
    [copyPreview.data?.items],
  )
  const visibleCopyPreviewItems = useMemo(
    () => [...(copyPreview.data?.items ?? [])].sort((a, b) => {
      const aHasProblem = a.warnings.length > 0 || a.blockingReasons.length > 0
      const bHasProblem = b.warnings.length > 0 || b.blockingReasons.length > 0
      return Number(bHasProblem) - Number(aHasProblem)
    }),
    [copyPreview.data?.items],
  )
  const assignmentSummary = assignmentsQuery.data?.summary
  const coverage = {
    total: assignmentsQuery.data?.pagination.total ?? 0,
    scheduled: assignmentSummary?.scheduled ?? 0,
    working: assignmentSummary?.checked_in ?? 0,
    completed: (assignmentSummary?.checked_out ?? 0) + (assignmentSummary?.completed ?? 0),
    cancelled: assignmentSummary?.cancelled ?? 0,
  }

  useEffect(() => {
    const firstProject = projectsQuery.data?.data?.[0]
    if (!firstProject || projectFilter) return
    setProjectFilter(firstProject.id)
    setAssignmentProjectId(firstProject.id)
  }, [projectFilter, projectsQuery.data?.data])

  useEffect(() => {
    const previous = previousMonthBounds(scheduleMonth)
    setCopySourceFrom(previous.from)
    setCopySourceTo(previous.to)
    setCopyTargetStart(`${scheduleMonth}-01`)
    setScheduleDate((current) => current.startsWith(`${scheduleMonth}-`)
      ? current
      : `${scheduleMonth}-01`)
    setSchedulePage(1)
    setAssignmentWarnings([])
    setAssignmentConflictToken('')
    copyPreview.reset()
    setCopyRequestId('')
  // Reset copy inputs only when the selected operating month changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleMonth])

  useEffect(() => {
    if (!cancelTarget) return
    cancelReasonRef.current?.focus()
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !cancelAssignment.isPending) {
        event.preventDefault()
        setCancelTarget(null)
        setCancelReason('')
        requestAnimationFrame(() => cancelReturnFocusRef.current?.focus())
        return
      }
      if (event.key === 'Tab') {
        const focusable = Array.from(cancelDialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [])
        if (focusable.length === 0) return
        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [cancelTarget, cancelAssignment.isPending])

  useEffect(() => {
    if (!manualTarget) return
    manualReasonRef.current?.focus()
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && !recordManualAttendance.isPending) {
        event.preventDefault()
        setManualTarget(null)
        setManualReason('')
        requestAnimationFrame(() => manualReturnFocusRef.current?.focus())
        return
      }
      if (event.key === 'Tab') {
        const focusable = Array.from(manualDialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [])
        if (focusable.length === 0) return
        const first = focusable[0]!
        const last = focusable[focusable.length - 1]!
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [manualTarget, recordManualAttendance.isPending])

  function selectTab(tab: 'attendance' | 'schedule') {
    setActiveTab(tab)
    requestAnimationFrame(() => {
      (tab === 'attendance' ? attendanceTabRef : scheduleTabRef).current?.focus()
    })
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!canSchedule || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    event.preventDefault()
    selectTab(activeTab === 'attendance' ? 'schedule' : 'attendance')
  }

  function closeCancellation() {
    setCancelTarget(null)
    setCancelReason('')
    requestAnimationFrame(() => cancelReturnFocusRef.current?.focus())
  }

  function submitAssignment(event: FormEvent) {
    event.preventDefault()
    setNotice(null)
    setAssignmentWarnings([])
    setAssignmentConflictToken('')
    createAssignment.mutate(false)
  }

  function submitTemplate(event: FormEvent) {
    event.preventDefault()
    setNotice(null)
    createTemplate.mutate()
  }

  function submitCancellation(event: FormEvent) {
    event.preventDefault()
    setNotice(null)
    cancelAssignment.mutate()
  }

  function openManualAttendance(
    assignment: ShiftAssignment,
    returnFocus: HTMLButtonElement,
  ) {
    const event = assignment.attendanceRecord?.checkInAt ? 'check_out' : 'check_in'
    const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
    recordManualAttendance.reset()
    manualReturnFocusRef.current = returnFocus
    setManualTarget(assignment)
    setManualEvent(event)
    setManualOccurredAt(localNow)
    setManualReasonCode('device_failure')
    setManualReason('')
  }

  function closeManualAttendance(force = false) {
    if (recordManualAttendance.isPending && !force) return
    setManualTarget(null)
    setManualReason('')
    requestAnimationFrame(() => manualReturnFocusRef.current?.focus())
  }

  function submitManualAttendance(event: FormEvent) {
    event.preventDefault()
    setNotice(null)
    recordManualAttendance.mutate()
  }

  return (
    <>
      <TopNav userEmail={user?.email || user?.phone} userName={user?.fullName} role={user?.role} />

      <main className="page">
        <div className="attendance-tabs" role="tablist" aria-label="Quản lý chấm công">
          <button
            id="attendance-tab"
            ref={attendanceTabRef}
            type="button"
            role="tab"
            aria-selected={activeTab === 'attendance'}
            aria-controls="attendance-panel"
            tabIndex={activeTab === 'attendance' ? 0 : -1}
            className={activeTab === 'attendance' ? 'active' : ''}
            onClick={() => setActiveTab('attendance')}
            onKeyDown={handleTabKeyDown}
          >
            Điểm danh hôm nay
          </button>
          {canSchedule && (
            <button
              id="schedule-tab"
              ref={scheduleTabRef}
              type="button"
              role="tab"
              aria-selected={activeTab === 'schedule'}
              aria-controls="schedule-panel"
              tabIndex={activeTab === 'schedule' ? 0 : -1}
              className={activeTab === 'schedule' ? 'active' : ''}
              onClick={() => setActiveTab('schedule')}
              onKeyDown={handleTabKeyDown}
            >
              Lịch ca
            </button>
          )}
        </div>

        {activeTab === 'attendance' ? (
          <section id="attendance-panel" role="tabpanel" aria-labelledby="attendance-tab">
            <div className="page-header">
              <div>
                <h1 className="page-title">Chấm công hôm nay</h1>
                <p className="page-subtitle">{formatVietnamLongDate()} · Tự động làm mới mỗi 30 giây</p>
              </div>
              <input
                aria-label="Lọc điểm danh theo dự án"
                type="search"
                placeholder="Lọc dự án..."
                value={attendanceFilter}
                onChange={(event) => setAttendanceFilter(event.target.value)}
                className="compact-filter"
              />
            </div>

            {attendanceQuery.isLoading && <div className="card text-center"><span className="spinner" /> Đang tải dữ liệu...</div>}
            {attendanceQuery.error && <div className="alert alert-error" role="alert">Không thể tải: {readableError(attendanceQuery.error)}</div>}
            {!attendanceQuery.isLoading && filteredAttendance.length === 0 && (
              <div className="card text-center text-muted">Hôm nay chưa có check-in nào.</div>
            )}

            {filteredAttendance.map(([code, { project, records }]) => (
              <div key={code} className="page-card">
                <div className="page-card-head">
                  <h3 className="page-card-title">
                    {project.name} <span className="project-code">{project.code}</span>
                  </h3>
                  <span className="badge badge-neutral">{records.length} lượt</span>
                </div>
                <div className="table-wrap-borderless">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mã NV</th><th>Họ tên</th><th>Ca</th><th>Check-in</th><th>Check-out</th>
                        <th>Tổng giờ</th><th>Trạng thái</th><th aria-label="Thao tác" />
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td><code>{record.shiftAssignment.employee.employeeCode}</code></td>
                          <td className="font-medium">{record.shiftAssignment.employee.fullName}</td>
                          <td>
                            <div>{record.shiftAssignment.shift.name}</div>
                            <div className="text-xs text-muted">{record.shiftAssignment.shift.startTime}–{record.shiftAssignment.shift.endTime}</div>
                          </td>
                          <td>{timeLabel(record.checkInAt)}</td>
                          <td>{timeLabel(record.checkOutAt)}</td>
                          <td>{record.totalMinutesWorked ? `${Math.round(record.totalMinutesWorked / 6) / 10}h` : '—'}</td>
                          <td>
                            <span className={`badge ${ATTENDANCE_STATUS[record.status]?.cls ?? 'badge-neutral'}`}>{ATTENDANCE_STATUS[record.status]?.label ?? record.status}</span>
                            {record.overrideById && <span className="badge badge-warning" title={record.overrideReason ?? 'Ghi nhận thủ công'}>Ngoại lệ thủ công</span>}
                          </td>
                          <td><button type="button" className="btn btn-ghost btn-sm" onClick={() => setOverrideTarget(record)}>Sửa</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section id="schedule-panel" role="tabpanel" aria-labelledby="schedule-tab">
            <div className="schedule-heading">
              <div>
                <p className="schedule-eyebrow">Điều phối nhân sự</p>
                <h1 className="page-title">Lịch dự án theo tháng</h1>
                <p className="page-subtitle">Xem lịch cả tháng, copy lịch có xem trước và xác nhận cảnh báo xung đột.</p>
              </div>
              <div className="month-project-controls">
                <label className="date-control">
                  <span>Dự án</span>
                  <select aria-label="Dự án xem lịch tháng" disabled={createAssignment.isPending} value={projectFilter} onChange={(event) => {
                    setProjectFilter(event.target.value)
                    setAssignmentProjectId(event.target.value)
                    setAssignmentWarnings([])
                    setAssignmentConflictToken('')
                    setSchedulePage(1)
                    copyPreview.reset()
                  }}>
                    <option value="">Chọn dự án</option>
                    {(projectsQuery.data?.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}
                  </select>
                </label>
                <label className="date-control">
                  <span>Tháng</span>
                  <input aria-label="Tháng xem lịch dự án" disabled={createAssignment.isPending} type="month" value={scheduleMonth} onChange={(event) => setScheduleMonth(event.target.value)} />
                </label>
              </div>
            </div>

            <div className="coverage-rail" aria-label="Tổng quan lịch ca">
              <div><span>Tổng lịch</span><strong>{coverage.total}</strong></div>
              <div><span>Chờ vào ca</span><strong>{coverage.scheduled}</strong></div>
              <div><span>Đang làm</span><strong>{coverage.working}</strong></div>
              <div><span>Hoàn thành</span><strong>{coverage.completed}</strong></div>
              <div><span>Đã hủy</span><strong>{coverage.cancelled}</strong></div>
            </div>

            {notice && <div className={`alert alert-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'} aria-live={notice.type === 'error' ? 'assertive' : 'polite'}>{notice.text}</div>}

            <div className="schedule-layout">
              <div className="schedule-main">
                <div className="page-card">
                  <div className="page-card-head">
                    <div>
                      <h2 className="page-card-title">Phân ca mới</h2>
                      <p className="card-description">Lịch trùng hoàn toàn bị chặn; xung đột khác sẽ cảnh báo để xác nhận.</p>
                    </div>
                    <span className="badge badge-info">{scheduleDate}</span>
                  </div>
                  <form className="page-card-body assignment-form" onSubmit={submitAssignment}>
                    <label className="form-group">
                      <span className="form-label">Ngày làm việc</span>
                      <input
                        aria-label="Ngày làm việc"
                        required
                        type="date"
                        min={selectedMonth.from}
                        max={selectedMonth.to}
                        disabled={createAssignment.isPending}
                        value={scheduleDate}
                        onChange={(event) => {
                          setScheduleDate(event.target.value)
                          setAssignmentWarnings([])
                          setAssignmentConflictToken('')
                        }}
                      />
                    </label>
                    <label className="form-group">
                      <span className="form-label">Nhân viên</span>
                      <input
                        aria-label="Tìm nhân viên để phân ca"
                        type="search"
                        placeholder="Tìm theo mã hoặc họ tên..."
                        disabled={createAssignment.isPending}
                        value={employeeSearch}
                        onChange={(event) => setEmployeeSearch(event.target.value)}
                      />
                      <select aria-label="Nhân viên phân ca" required disabled={createAssignment.isPending} value={assignmentEmployeeId} onChange={(event) => {
                        setAssignmentEmployeeId(event.target.value)
                        setAssignmentWarnings([])
                        setAssignmentConflictToken('')
                      }}>
                        <option value="">Chọn nhân viên</option>
                        {(employeesQuery.data?.data ?? []).map((employee) => <option key={employee.id} value={employee.id}>{employee.employeeCode} · {employee.fullName}</option>)}
                      </select>
                    </label>
                    <label className="form-group">
                      <span className="form-label">Dự án</span>
                      <select aria-label="Dự án phân ca" required disabled={createAssignment.isPending} value={assignmentProjectId} onChange={(event) => {
                        setAssignmentProjectId(event.target.value)
                        setAssignmentWarnings([])
                        setAssignmentConflictToken('')
                      }}>
                        <option value="">Chọn dự án</option>
                        {(projectsQuery.data?.data ?? []).map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}
                      </select>
                    </label>
                    <label className="form-group">
                      <span className="form-label">Khung giờ</span>
                      <select aria-label="Khung giờ phân ca" required disabled={createAssignment.isPending} value={assignmentShiftId} onChange={(event) => {
                        setAssignmentShiftId(event.target.value)
                        setAssignmentWarnings([])
                        setAssignmentConflictToken('')
                      }}>
                        <option value="">Chọn ca</option>
                        {(shiftsQuery.data?.data ?? []).map((shift) => <option key={shift.id} value={shift.id}>{shift.name} · {shift.startTime}–{shift.endTime}</option>)}
                      </select>
                    </label>
                    <label className="form-group assignment-notes">
                      <span className="form-label">Ghi chú</span>
                      <input aria-label="Ghi chú phân ca" disabled={createAssignment.isPending} type="text" maxLength={500} placeholder="Vị trí trực, bàn giao..." value={assignmentNotes} onChange={(event) => {
                        setAssignmentNotes(event.target.value)
                        setAssignmentWarnings([])
                        setAssignmentConflictToken('')
                      }} />
                    </label>
                    <button className="btn btn-primary assignment-submit" type="submit" disabled={createAssignment.isPending || !assignmentEmployeeId || !assignmentProjectId || !assignmentShiftId}>
                      {createAssignment.isPending ? 'Đang xếp ca...' : 'Xếp ca'}
                    </button>
                  </form>
                  {assignmentWarnings.length > 0 && (
                    <div className="page-card-body schedule-warning-box" role="alert">
                      <strong>Cảnh báo xung đột</strong>
                      <ul>{assignmentWarnings.map((warning, index) => <li key={`${warning.type}-${index}`}>{warning.message}</li>)}</ul>
                      <div className="table-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                          setAssignmentWarnings([])
                          setAssignmentConflictToken('')
                        }}>Quay lại</button>
                        <button type="button" className="btn btn-warning btn-sm" disabled={createAssignment.isPending} onClick={() => createAssignment.mutate(true)}>Vẫn lưu lịch</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="page-card">
                  <div className="page-card-head">
                    <div>
                      <h2 className="page-card-title">Copy lịch</h2>
                      <p className="card-description">Copy lịch trong cùng dự án; dữ liệu chấm công và trạng thái cũ không được copy.</p>
                    </div>
                  </div>
                  <form className="page-card-body copy-schedule-form" onSubmit={(event) => { event.preventDefault(); copyPreview.mutate() }}>
                    <label className="form-group"><span className="form-label">Từ ngày</span><input aria-label="Ngày nguồn bắt đầu" required type="date" value={copySourceFrom} onChange={(event) => { setCopySourceFrom(event.target.value); copyPreview.reset() }} /></label>
                    <label className="form-group"><span className="form-label">Đến ngày</span><input aria-label="Ngày nguồn kết thúc" required type="date" value={copySourceTo} onChange={(event) => { setCopySourceTo(event.target.value); copyPreview.reset() }} /></label>
                    <label className="form-group"><span className="form-label">Ngày đích bắt đầu</span><input aria-label="Ngày đích bắt đầu" required type="date" value={copyTargetStart} onChange={(event) => { setCopyTargetStart(event.target.value); copyPreview.reset() }} /></label>
                    <button type="submit" className="btn btn-secondary" disabled={!projectFilter || copyPreview.isPending}>{copyPreview.isPending ? 'Đang kiểm tra...' : 'Xem trước copy'}</button>
                  </form>
                  {copyPreview.error && <div className="page-card-body"><div className="alert alert-error" role="alert">{readableError(copyPreview.error)}</div></div>}
                  {copyPreview.data && (
                    <div className="page-card-body copy-preview">
                      <div className="coverage-rail compact-coverage">
                        <div><span>Sẽ copy</span><strong>{copyPreview.data.summary.total}</strong></div>
                        <div><span>Cảnh báo</span><strong>{copyPreview.data.summary.warningCount}</strong></div>
                        <div><span>Bị chặn</span><strong>{copyPreview.data.summary.blockingCount}</strong></div>
                      </div>
                      {copyPreview.data.summary.warningCount > 0 && <div className="alert alert-warning">Có lịch trùng thời gian hoặc nhân viên có nhiều ca trong ngày. Có thể tiếp tục sau khi xác nhận.</div>}
                      {copyPreview.data.summary.blockingCount > 0 && <div className="alert alert-error">Có lịch trùng hoàn toàn hoặc dữ liệu không còn hợp lệ. Cần xử lý trước khi copy.</div>}
                      {copyPreview.data.items.length === 0 ? (
                        <div className="schedule-empty"><span>Khoảng nguồn chưa có lịch để copy.</span></div>
                      ) : (
                        <div className="table-wrap-borderless">
                          <table className="table compact-copy-table">
                            <thead><tr><th>Nhân viên</th><th>Ngày nguồn</th><th>Ngày đích</th><th>Ca</th><th>Kết quả</th></tr></thead>
                            <tbody>
                              {visibleCopyPreviewItems.map((item) => (
                                <tr key={item.sourceAssignmentId}>
                                  <td>{item.employee.employeeCode} · {item.employee.fullName}</td>
                                  <td>{dateLabel(item.sourceDate)}</td>
                                  <td>{dateLabel(item.targetDate)}</td>
                                  <td>{item.shift.name}</td>
                                  <td>
                                    {item.blockingReasons.length > 0 ? (
                                      <ul className="copy-issue-list">
                                        {item.blockingReasons.map((reason) => <li key={reason}><span className="badge badge-danger">Bị chặn</span> {COPY_BLOCKER_LABELS[reason] ?? reason}</li>)}
                                      </ul>
                                    ) : item.warnings.length > 0 ? (
                                      <ul className="copy-issue-list">
                                        {item.warnings.map((warning) => <li key={warning.type}><span className="badge badge-warning">Cảnh báo</span> {warning.message} ({warning.conflictCount})</li>)}
                                      </ul>
                                    ) : <span className="badge badge-success">Hợp lệ</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="form-help">
                            Đang hiển thị đầy đủ {copyPreview.data.items.length} lịch
                            {copyProblemItems.length > 0 ? '; lịch có cảnh báo hoặc bị chặn được đưa lên đầu.' : '.'}
                          </p>
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={copySchedule.isPending || copyPreview.data.summary.total === 0 || copyPreview.data.summary.blockingCount > 0}
                        onClick={() => copySchedule.mutate(copyPreview.data!.summary.warningCount > 0)}
                      >
                        {copySchedule.isPending ? 'Đang copy...' : copyPreview.data.summary.warningCount > 0 ? 'Xác nhận cảnh báo và copy' : 'Xác nhận copy'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="page-card">
                  <div className="page-card-head roster-head">
                    <div>
                      <h2 className="page-card-title">Danh sách ca trong tháng</h2>
                      <p className="card-description">{selectedMonth.from} → {selectedMonth.to} · Hiển thị cả lịch đã hủy để đối soát.</p>
                    </div>
                    <div className="roster-filters">
                      <select aria-label="Lọc lịch theo nhân viên" value={employeeFilter} onChange={(event) => { setEmployeeFilter(event.target.value); setSchedulePage(1) }}>
                        <option value="">Mọi nhân viên</option>
                        {(employeesQuery.data?.data ?? []).map((employee) => <option key={employee.id} value={employee.id}>{employee.employeeCode}</option>)}
                      </select>
                      <select aria-label="Lọc lịch theo trạng thái" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setSchedulePage(1) }}>
                        <option value="">Mọi trạng thái</option>
                        {Object.entries(ASSIGNMENT_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {(assignmentsQuery.isLoading || shiftsQuery.isLoading || projectsQuery.isLoading || employeesQuery.isLoading) && (
                    <div className="table-empty"><span className="spinner" /> Đang tải kế hoạch...</div>
                  )}
                  {(assignmentsQuery.error || shiftsQuery.error || projectsQuery.error || employeesQuery.error) && (
                    <div className="page-card-body"><div className="alert alert-error" role="alert">Không thể tải dữ liệu lịch ca. Vui lòng kiểm tra quyền tài khoản và thử lại.</div></div>
                  )}
                  {!assignmentsQuery.isLoading && !assignmentsQuery.error && assignments.length === 0 && (
                    <div className="schedule-empty"><span>Tháng này chưa có lịch ca.</span><small>Chọn ngày, nhân viên và khung giờ ở phía trên để bắt đầu.</small></div>
                  )}
                  {assignments.length > 0 && (
                    <div className="table-wrap-borderless">
                      <table className="table schedule-table">
                        <thead><tr><th>Ngày</th><th>Nhân viên</th><th>Dự án</th><th>Khung giờ</th><th>Điểm danh</th><th>Trạng thái</th><th>Ghi chú</th><th aria-label="Thao tác" /></tr></thead>
                        <tbody>
                          {assignments.map((assignment) => (
                            <tr key={assignment.id} className={assignment.status === 'cancelled' ? 'cancelled-row' : ''}>
                              <td><strong>{dateLabel(assignment.date)}</strong></td>
                              <td><strong>{assignment.employee.fullName}</strong><small>{assignment.employee.employeeCode}</small></td>
                              <td><strong>{assignment.project.code}</strong><small>{assignment.project.name}</small></td>
                              <td><span className="shift-dot" style={{ background: assignment.shift.color ?? '#999' }} />{assignment.shift.name}<small>{assignment.shift.startTime}–{assignment.shift.endTime}{assignment.shift.isOvernight ? ' · qua đêm' : ''}</small></td>
                              <td>
                                {assignment.attendanceRecord ? `${timeLabel(assignment.attendanceRecord.checkInAt)} → ${timeLabel(assignment.attendanceRecord.checkOutAt)}` : 'Chưa ghi nhận'}
                                {assignment.attendanceRecord?.overrideById && <span className="badge badge-warning" title={assignment.attendanceRecord.overrideReason ?? 'Ghi nhận thủ công'}>Thủ công</span>}
                              </td>
                              <td><span className={`badge ${ASSIGNMENT_STATUS[assignment.status].cls}`}>{ASSIGNMENT_STATUS[assignment.status].label}</span></td>
                              <td className="notes-cell">{assignment.notes || '—'}</td>
                              <td>
                                <div className="table-actions">
                                  {canManualAttendance && ['scheduled', 'missed', 'checked_in'].includes(assignment.status) && (
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={(event) => openManualAttendance(assignment, event.currentTarget)}>{assignment.attendanceRecord?.checkInAt ? 'Ghi ra ca' : 'Ghi vào ca'}</button>
                                  )}
                                  {assignment.status === 'scheduled' && !assignment.attendanceRecord && <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={(event) => { cancelReturnFocusRef.current = event.currentTarget; cancelAssignment.reset(); setCancelTarget(assignment); setCancelReason('') }}>Hủy ca</button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {(assignmentsQuery.data?.pagination.totalPages ?? 0) > 1 && (
                    <nav className="schedule-pagination" aria-label="Phân trang lịch ca">
                      <button type="button" className="btn btn-secondary btn-sm" disabled={schedulePage <= 1} onClick={() => setSchedulePage((page) => page - 1)}>Trang trước</button>
                      <span>Trang {schedulePage}/{assignmentsQuery.data!.pagination.totalPages} · {assignmentsQuery.data!.pagination.total} lịch</span>
                      <button type="button" className="btn btn-secondary btn-sm" disabled={schedulePage >= assignmentsQuery.data!.pagination.totalPages} onClick={() => setSchedulePage((page) => page + 1)}>Trang sau</button>
                    </nav>
                  )}
                </div>
              </div>

              {canCreateTemplate && (
                <aside className="page-card shift-template-card">
                  <div className="page-card-head">
                    <div>
                      <p className="schedule-eyebrow">Thiết lập</p>
                      <h2 className="page-card-title">Tạo mẫu ca</h2>
                    </div>
                  </div>
                  <form className="page-card-body form" onSubmit={submitTemplate}>
                    <label className="form-group"><span className="form-label">Tên ca</span><input aria-label="Tên mẫu ca" required maxLength={100} type="text" placeholder="Ví dụ: Ca sáng" value={templateName} onChange={(event) => setTemplateName(event.target.value)} /></label>
                    <div className="time-grid">
                      <label className="form-group"><span className="form-label">Bắt đầu</span><input aria-label="Giờ bắt đầu" required type="time" value={templateStart} onChange={(event) => setTemplateStart(event.target.value)} /></label>
                      <label className="form-group"><span className="form-label">Kết thúc</span><input aria-label="Giờ kết thúc" required type="time" value={templateEnd} onChange={(event) => setTemplateEnd(event.target.value)} /></label>
                    </div>
                    {templateEnd < templateStart && <span className="badge badge-info overnight-badge">Ca qua đêm</span>}
                    <div className="time-grid">
                      <label className="form-group"><span className="form-label">Nghỉ (phút)</span><input aria-label="Số phút nghỉ" required min="0" type="number" value={templateBreak} onChange={(event) => setTemplateBreak(event.target.value)} /></label>
                      <label className="form-group"><span className="form-label">Ngưỡng trễ</span><input aria-label="Ngưỡng đi trễ" required min="0" type="number" value={templateLate} onChange={(event) => setTemplateLate(event.target.value)} /></label>
                    </div>
                    <label className="form-group color-field"><span className="form-label">Màu nhận diện</span><input aria-label="Màu nhận diện ca" type="color" value={templateColor} onChange={(event) => setTemplateColor(event.target.value)} /></label>
                    <button type="submit" className="btn btn-secondary btn-block" disabled={createTemplate.isPending || !templateName.trim()}>{createTemplate.isPending ? 'Đang tạo...' : 'Lưu mẫu ca'}</button>
                  </form>
                </aside>
              )}
            </div>
          </section>
        )}

        {overrideTarget && <AttendanceOverrideModal record={overrideTarget} onClose={() => setOverrideTarget(null)} />}

        {manualTarget && (
          <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeManualAttendance() }}>
            <form ref={manualDialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="manual-attendance-title" aria-describedby="manual-attendance-description" onSubmit={submitManualAttendance}>
              <div className="modal-head">
                <h2 className="modal-title" id="manual-attendance-title">Ghi nhận chấm công thủ công</h2>
                <button type="button" className="modal-close" aria-label="Đóng" disabled={recordManualAttendance.isPending} onClick={() => closeManualAttendance()}>×</button>
              </div>
              <div className="modal-body form">
                <div className="alert alert-warning" id="manual-attendance-description" role="note">Chỉ dùng khi giám sát đã xác nhận trực tiếp và thiết bị không thể chụp ảnh. Bản ghi sẽ được đánh dấu ngoại lệ để BO đối soát.</div>
                <div className="cancel-summary"><strong>{manualTarget.employee.fullName}</strong><span>{manualTarget.project.code} · {manualTarget.shift.name} · {manualTarget.shift.startTime}–{manualTarget.shift.endTime}</span></div>
                {recordManualAttendance.error && <div className="alert alert-error" role="alert">{readableError(recordManualAttendance.error)}</div>}
                <label className="form-group">
                  <span className="form-label">Sự kiện</span>
                  <select aria-label="Sự kiện chấm công thủ công" value={manualEvent} onChange={(event) => setManualEvent(event.target.value as 'check_in' | 'check_out')} disabled>
                    <option value="check_in">Vào ca</option><option value="check_out">Ra ca</option>
                  </select>
                </label>
                <label className="form-group">
                  <span className="form-label">Thời điểm thực tế</span>
                  <input aria-label="Thời điểm chấm công thủ công" required type="datetime-local" max={new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)} value={manualOccurredAt} onChange={(event) => setManualOccurredAt(event.target.value)} />
                </label>
                <label className="form-group">
                  <span className="form-label">Loại sự cố</span>
                  <select aria-label="Loại sự cố thiết bị" value={manualReasonCode} onChange={(event) => setManualReasonCode(event.target.value as typeof manualReasonCode)}>
                    <option value="device_failure">Camera thiết bị bị hỏng</option>
                    <option value="capture_unavailable">Không thể chụp ảnh</option>
                    <option value="permission_blocked">Quyền camera bị chặn</option>
                  </select>
                </label>
                <label className="form-group">
                  <span className="form-label">Ghi chú xác minh</span>
                  <textarea ref={manualReasonRef} aria-label="Ghi chú xác minh thủ công" required minLength={10} maxLength={500} rows={4} placeholder="Nêu cách giám sát đã xác nhận nhân viên có mặt..." value={manualReason} onChange={(event) => setManualReason(event.target.value)} />
                  <span className="form-help">{manualReason.trim().length}/500 ký tự</span>
                </label>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-secondary" disabled={recordManualAttendance.isPending} onClick={() => closeManualAttendance()}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={recordManualAttendance.isPending || !manualOccurredAt || manualReason.trim().length < 10}>{recordManualAttendance.isPending ? 'Đang ghi nhận...' : 'Xác nhận và lưu audit'}</button>
              </div>
            </form>
          </div>
        )}

        {cancelTarget && (
          <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !cancelAssignment.isPending) closeCancellation() }}>
            <form ref={cancelDialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="cancel-shift-title" aria-describedby="cancel-shift-description" onSubmit={submitCancellation}>
              <div className="modal-head">
                <h2 className="modal-title" id="cancel-shift-title">Hủy lịch ca</h2>
                <button type="button" className="modal-close" aria-label="Đóng" onClick={closeCancellation}>×</button>
              </div>
              <div className="modal-body form">
                <div className="cancel-summary" id="cancel-shift-description"><strong>{cancelTarget.employee.fullName}</strong><span>{cancelTarget.project.code} · {cancelTarget.shift.name} · {cancelTarget.shift.startTime}–{cancelTarget.shift.endTime}</span></div>
                {cancelAssignment.error && <div className="alert alert-error" role="alert">{readableError(cancelAssignment.error)}</div>}
                <label className="form-group">
                  <span className="form-label">Lý do hủy</span>
                  <textarea ref={cancelReasonRef} aria-label="Lý do hủy ca" required minLength={10} maxLength={500} rows={4} placeholder="Tối thiểu 10 ký tự để phục vụ đối soát..." value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} />
                  <span className="form-help">{cancelReason.trim().length}/500 ký tự</span>
                </label>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-secondary" onClick={closeCancellation}>Giữ lịch</button>
                <button type="submit" className="btn btn-danger" disabled={cancelAssignment.isPending || cancelReason.trim().length < 10}>{cancelAssignment.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  )
}
