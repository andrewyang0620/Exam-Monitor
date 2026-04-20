'use client'

import { useState } from 'react'
import {
  Plus,
  Bell,
  Mail,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Calendar,
  ExternalLink,
  Trash2,
  ChevronDown,
  CheckCircle,
} from 'lucide-react'
import type { MonitoringRule, Platform, ExamType } from '@tcf-tracker/types'
import { getStatusColor, getStatusDotColor, getStatusLabel, formatTimeAgo } from '@tcf-tracker/utils'
import { MOCK_RULES, MOCK_PLATFORMS, MOCK_OBSERVATIONS } from '@/lib/mock-data'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const EXAM_TYPES: ExamType[] = ['TCF Canada', 'TEF Canada', 'TEF', 'TCF', 'DELF', 'DALF']
const CHANNELS = [
  { id: 'browser', label: 'Browser', icon: Bell },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: Smartphone },
] as const

function RuleCard({ rule, onToggle }: { rule: MonitoringRule; onToggle: (id: string) => void }) {
  const obs = MOCK_OBSERVATIONS.find((o) => o.platformId === rule.platformId)

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border shadow-card transition-all duration-200',
        rule.isActive ? 'border-slate-200 hover:shadow-card-hover' : 'border-slate-100 opacity-60'
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {rule.platformDisplayName}
              </h3>
              {obs && (
                <Badge
                  variant={
                    obs.availabilityStatus === 'OPEN'
                      ? 'open'
                      : obs.availabilityStatus === 'SOLD_OUT'
                      ? 'sold'
                      : obs.availabilityStatus === 'EXPECTED'
                      ? 'expected'
                      : 'monitoring'
                  }
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDotColor(obs.availabilityStatus))} />
                  {getStatusLabel(obs.availabilityStatus)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {rule.examType}
              </span>
              {rule.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {rule.city}
                </span>
              )}
              {rule.datePreference && rule.datePreference !== 'any' && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {rule.datePreference}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onToggle(rule.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              {rule.isActive ? (
                <ToggleRight className="w-7 h-7 text-blue-600" />
              ) : (
                <ToggleLeft className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>

        {/* Observation detail */}
        {obs && (
          <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>{obs.seatsText}</span>
              <span className="text-slate-400">{formatTimeAgo(obs.observedAt)}</span>
            </div>
          </div>
        )}

        {/* Channels */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Alert via</span>
          {CHANNELS.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors',
                rule.channels.includes(id as any)
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border-slate-200 text-slate-400'
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </div>
          ))}
          {rule.channels.includes('sms') && (
            <span className="text-[10px] text-slate-400">(mock in V1)</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {obs?.availabilityStatus === 'OPEN' && (
            <Button size="sm" variant="success" className="gap-1.5 text-xs flex-1">
              <ExternalLink className="w-3 h-3" />
              Open Official Page
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            Edit
          </Button>
          <Button size="icon-sm" variant="ghost" className="text-slate-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function CreateRuleDialog({
  open,
  onClose,
  platforms,
}: {
  open: boolean
  onClose: () => void
  platforms: Platform[]
}) {
  const [step, setStep] = useState(1)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedExam, setSelectedExam] = useState<ExamType | ''>('')
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['browser', 'email'])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const platform = platforms.find((p) => p.id === selectedPlatform)
  const availableExams = platform?.examTypesSupported ?? EXAM_TYPES

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setDone(true)
    await new Promise((r) => setTimeout(r, 1200))
    onClose()
    setStep(1)
    setSelectedPlatform('')
    setSelectedExam('')
    setDone(false)
  }

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    )
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Monitoring Rule</DialogTitle>
          <DialogDescription>
            Choose a platform, exam type, and alert channels.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-900">Rule created!</p>
            <p className="text-xs text-slate-500">Monitoring will start within the next check cycle.</p>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Platform select */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Exam center
              </label>
              <div className="relative">
                <select
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedPlatform}
                  onChange={(e) => {
                    setSelectedPlatform(e.target.value)
                    setSelectedExam('')
                  }}
                >
                  <option value="">Select a platform...</option>
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName} · {p.city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Exam type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Exam type
              </label>
              <div className="flex flex-wrap gap-2">
                {availableExams.map((exam) => (
                  <button
                    key={exam}
                    onClick={() => setSelectedExam(exam)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      selectedExam === exam
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                    )}
                  >
                    {exam}
                  </button>
                ))}
              </div>
            </div>

            {/* Date preference */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Date preference <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. any, 2026-Q2, June 2026"
                className="text-sm"
              />
            </div>

            {/* Alert channels */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Alert channels
              </label>
              <div className="flex gap-2">
                {CHANNELS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => toggleChannel(id)}
                    disabled={id === 'sms'}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                      selectedChannels.includes(id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 text-slate-600 hover:border-blue-300',
                      id === 'sms' && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    {id === 'sms' && <span className="text-[9px] opacity-70">soon</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {!done && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!selectedPlatform || !selectedExam || saving}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving...
                </div>
              ) : (
                'Create Rule'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function RulesPage() {
  const [rules, setRules] = useState(MOCK_RULES)
  const [createOpen, setCreateOpen] = useState(false)

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    )
  }

  const activeCount = rules.filter((r) => r.isActive).length

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader
        title="My Exams"
        subtitle={`${activeCount} active monitoring rule${activeCount !== 1 ? 's' : ''}`}
      />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Monitoring Rules</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Add rules to monitor specific exam centers and types
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add Rule
            </Button>
          </div>

          {/* Rules grid */}
          {rules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">No monitoring rules yet</p>
              <p className="text-xs text-slate-500 mb-4">
                Add a rule to start tracking exam seat availability
              </p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Add First Rule
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} />
              ))}

              {/* Add more card */}
              <button
                onClick={() => setCreateOpen(true)}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all duration-200"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm font-medium">Add monitoring rule</span>
              </button>
            </div>
          )}

          {/* Info box */}
          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">How monitoring works</h3>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                We check public exam pages every 1–5 minutes depending on the platform
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                When seat status changes, you receive an alert via your chosen channels
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Open the official page and use the Chrome extension to autofill your profile
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Final registration and payment are always completed manually by you
              </li>
            </ul>
          </div>
        </div>
      </main>

      <CreateRuleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        platforms={MOCK_PLATFORMS}
      />
    </div>
  )
}
