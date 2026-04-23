import Link from 'next/link'
import {
  Bell,
  Chrome,
  Clock,
  ExternalLink,
  HelpCircle,
  Lock,
  MousePointerClick,
  ShieldCheck,
} from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Button } from '@/components/ui/button'

const faqSections = [
  {
    title: 'Monitoring',
    icon: Clock,
    items: [
      {
        question: 'Which exam center is monitored with real data right now?',
        answer:
          'Alliance Francaise de Vancouver for TCF Canada is the first real monitored platform. Other listed centers may appear as preview or coming soon until their parser and monitoring pipeline are verified.',
      },
      {
        question: 'How often does the system check AF Vancouver?',
        answer:
          'The current Vercel Cron schedule checks the monitor endpoint every 5 minutes. A successful run updates the platform last check time and stores a new observation when the page is parsed.',
      },
      {
        question: 'What pages are checked?',
        answer:
          'The monitor reads the public TCF Canada page and the TCF Canada Full Exam product page. The public page is the main source for next sessions, sold out labels, and registration window text. The product page is kept as a cross-check in case order controls appear when registration opens.',
      },
      {
        question: 'Does the system guarantee a seat?',
        answer:
          'No. ExamSeat Monitor detects public page changes and sends alerts. The official website remains the source of truth, and seats can change before you complete registration.',
      },
    ],
  },
  {
    title: 'Statuses',
    icon: HelpCircle,
    items: [
      {
        question: 'What does Seats Available mean?',
        answer:
          'The monitor found a signal that registration may be open. You should open the official page and confirm on the exam center website before taking action.',
      },
      {
        question: 'What does Sold Out mean?',
        answer:
          'The monitor did not find a currently bookable session. This can include sold out sessions or future registration windows that are not open yet.',
      },
      {
        question: 'What does Monitoring mean?',
        answer:
          'The system is watching the platform, but it does not have a confident current conclusion yet. This can happen after a fetch issue, parser uncertainty, or while a platform is still being prepared.',
      },
      {
        question: 'Do you show exact seat counts?',
        answer:
          'Not at this stage. The product currently shows a simple conclusion status and supporting details such as the next registration window when the source page provides one.',
      },
    ],
  },
  {
    title: 'Alerts',
    icon: Bell,
    items: [
      {
        question: 'How do I receive alerts?',
        answer:
          'Follow a monitored exam from the dashboard. Your watchlist controls which platforms you care about and which notification channels are enabled.',
      },
      {
        question: 'When is an alert created?',
        answer:
          'Alerts are created when the monitor detects a meaningful status change, especially when a platform changes into Seats Available.',
      },
      {
        question: 'Can I rely only on email?',
        answer:
          'Email delivery depends on your account settings and the mail provider. For time-sensitive registration, keep the dashboard and browser notifications in your workflow as well.',
      },
    ],
  },
  {
    title: 'Autofill',
    icon: MousePointerClick,
    items: [
      {
        question: 'What does the Chrome extension do?',
        answer:
          'The extension helps fill supported official registration forms with your local profile information. It is an autofill assistant, not a registration robot.',
      },
      {
        question: 'Where is my autofill profile stored?',
        answer:
          'Your autofill profile is stored locally in the Chrome extension on your own device. It is not stored in the cloud database.',
      },
      {
        question: 'Does the extension submit the form for me?',
        answer:
          'No. You review the official page, confirm the form, submit, and pay manually. The extension only helps reduce typing.',
      },
    ],
  },
  {
    title: 'Privacy',
    icon: Lock,
    items: [
      {
        question: 'Do you store my official exam account password?',
        answer:
          'No. ExamSeat Monitor does not ask for or store official exam portal passwords, active sessions, or payment information.',
      },
      {
        question: 'What account data is stored in the cloud?',
        answer:
          'The web app stores your account email, display name, followed platforms, notification preferences, monitoring observations, and notification records.',
      },
      {
        question: 'Do you monitor private pages?',
        answer:
          'No. The monitor is designed around public pages that do not require your official exam account login.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader
        title="FAQ"
        subtitle="How ExamSeat Monitor works today"
      />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-card p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900 mb-1">
                  Current product boundary
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  ExamSeat Monitor watches supported public exam pages, records status changes,
                  and helps you react faster. It does not automatically register, submit forms,
                  hold seats, bypass official systems, or handle payment.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    AF Vancouver live
                  </span>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Public-page monitoring
                  </span>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Manual registration
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4">
            {faqSections.map((section) => {
              const Icon = section.icon
              return (
                <section
                  key={section.title}
                  className="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {section.items.map((item) => (
                      <details key={item.question} className="group">
                        <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                          <span className="text-sm font-medium text-slate-800">
                            {item.question}
                          </span>
                          <span className="text-slate-400 group-open:rotate-90 transition-transform">
                            <ExternalLink className="w-3.5 h-3.5 rotate-45" />
                          </span>
                        </summary>
                        <div className="px-6 pb-4 text-sm text-slate-500 leading-relaxed">
                          {item.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          <section className="bg-slate-900 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
              <Chrome className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-white mb-1">
                Need to fill a form faster?
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Use the Chrome extension on supported official pages. Your local profile stays
                on your device, and you remain responsible for final review and submission.
              </p>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/dashboard/platforms">
                  View supported platforms
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
