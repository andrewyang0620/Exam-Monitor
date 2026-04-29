import Link from 'next/link'
import {
  Activity,
  Bell,
  Shield,
  Globe,
  CheckCircle,
  ArrowRight,
  MousePointerClick,
  Eye,
  Zap,
  Lock,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">ExamSeat Monitor</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#platforms" className="hover:text-slate-900 transition-colors">Platforms</a>
            <a href="#privacy" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient pt-20 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Now monitoring TEF & TCF Canada seats across Canada
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight mb-6">
            Never miss an
            <br />
            <span className="text-blue-600">exam seat</span> again
          </h1>

          <p className="text-lg text-slate-500 leading-relaxed mb-3 max-w-2xl mx-auto">
            Monitor multiple Alliance Française and university exam centers simultaneously.
            Get instant alerts the moment seats open — then fill your registration form in seconds.
          </p>
          <p className="text-sm text-slate-400 mb-10">
            专为加拿大法语考试（TEF / TCF Canada）候选人设计 · 考位监控 + 本地自动填表
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/auth?mode=signup"
              className="flex items-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
            >
              Start monitoring free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 text-slate-600 px-7 py-3.5 rounded-xl font-medium text-base hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white transition-colors"
            >
              See how it works
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            {[
              'Privacy-first design',
              'Local autofill only',
              'Manual confirmation always',
              'No passwords stored',
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="py-16 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          {/* Simulated browser window */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-400">
                  app.examseat.ca/dashboard
                </div>
              </div>
            </div>
            {/* Mini dashboard mockup */}
            <div className="p-4 bg-slate-50" style={{ minHeight: '280px' }}>
              {/* Alert banner */}
              <div className="bg-emerald-600 rounded-xl p-3 mb-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span className="text-white text-xs font-medium">Seats Available — Alliance Française de Vancouver · TEF Canada · 28 min ago</span>
                <span className="ml-auto text-emerald-200 text-xs bg-emerald-500 px-2 py-0.5 rounded-md font-medium">Open Official Page →</span>
              </div>
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Active Rules', value: '3' },
                  { label: 'Open Alerts', value: '1', accent: true },
                  { label: 'Last Check', value: '2m ago' },
                  { label: 'Platforms', value: '4' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`bg-white rounded-xl p-3 border ${s.accent ? 'border-emerald-200' : 'border-slate-200'}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-1">{s.label}</div>
                    <div className={`text-xl font-bold ${s.accent ? 'text-emerald-600' : 'text-slate-900'}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              {/* Exam list preview */}
              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="text-xs font-semibold text-slate-700 mb-2">Monitored Exams</div>
                {[
                  { name: 'AF Vancouver', exam: 'TEF Canada', status: 'Seats Available', statusColor: 'text-emerald-600 bg-emerald-50' },
                  { name: 'AF Toronto', exam: 'TCF Canada', status: 'Sold Out', statusColor: 'text-slate-600 bg-slate-100' },
                  { name: 'Campus France', exam: 'TCF Canada', status: 'Sold Out', statusColor: 'text-slate-600 bg-slate-100' },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <div>
                      <span className="text-xs font-medium text-slate-800">{item.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">{item.exam}</span>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
              How it works
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              From alert to registered in minutes
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Three clear steps. You stay in control throughout.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Eye,
                title: 'We monitor',
                description:
                  'ExamSeat Monitor continuously checks official exam pages at multiple Alliance Française and university centers — so you don\'t have to refresh manually.',
                detail: 'Checks every 1–5 minutes',
              },
              {
                step: '02',
                icon: Bell,
                title: 'You get alerted',
                description:
                  'The moment seats become available, you receive an instant notification by email. No delays, no missed openings.',
                detail: 'Email alerts',
              },
              {
                step: '03',
                icon: MousePointerClick,
                title: 'Register quickly',
                description:
                  'Open the official exam page. Our Chrome extension detects it and autofills your profile info in one click. You confirm and submit manually.',
                detail: 'Your data, your device, your control',
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="relative">
                  <div className="text-7xl font-bold text-slate-50 mb-4 leading-none select-none">
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-3">{item.description}</p>
                  <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full inline-block">
                    {item.detail}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
              Features
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Built for exam candidates, not tech teams
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Globe,
                title: 'Multi-center monitoring',
                desc: 'Track Alliance Française Toronto, Vancouver, Campus France Canada, and more — all from one dashboard.',
              },
              {
                icon: Zap,
                title: 'Near-real-time alerts',
                desc: 'Checks public seat pages every 1–5 minutes. Get notified within minutes of seats becoming available.',
              },
              {
                icon: MousePointerClick,
                title: 'One-click autofill',
                desc: 'Chrome extension detects supported pages and fills your name, email, phone, and address automatically.',
              },
              {
                icon: Lock,
                title: 'Privacy-first design',
                desc: 'Your personal data stays in your browser. We never store passwords, sessions, or payment information.',
              },
              {
                icon: Bell,
                title: 'Email alerts',
                desc: 'Choose email alerts for the exams you follow.',
              },
              {
                icon: Shield,
                title: 'You stay in control',
                desc: 'Final registration and payment are always manual. The assistant fills the form — you confirm and submit.',
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-card transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Supported platforms */}
      <section id="platforms" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
              Supported platforms
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Canada's major exam centers
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              We monitor official public-facing registration pages. No login to exam portals required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                name: 'Alliance Française de Toronto',
                location: 'Toronto, ON',
                exams: ['TEF Canada', 'TCF Canada'],
                monitoring: 'Full',
                autofill: 'Full',
                health: 'operational',
              },
              {
                name: 'Alliance Française de Vancouver',
                location: 'Vancouver, BC',
                exams: ['TEF Canada', 'TCF Canada'],
                monitoring: 'Full',
                autofill: 'Full',
                health: 'operational',
              },
              {
                name: 'Campus France Canada',
                location: 'Montréal, QC',
                exams: ['TCF Canada'],
                monitoring: 'Partial',
                autofill: 'Partial',
                health: 'degraded',
              },
              {
                name: 'Université Laval — CLIC',
                location: 'Québec, QC',
                exams: ['TEF', 'TCF Canada', 'DELF/DALF'],
                monitoring: 'Partial',
                autofill: 'None',
                health: 'operational',
              },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 hover:shadow-card transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        p.health === 'operational'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {p.health === 'operational' ? '● Operational' : '⚠ Degraded'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{p.location}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.exams.map((e) => (
                      <span key={e} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium">
                        {e}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-[10px] text-slate-500">
                    <span>Monitoring: <strong className="text-slate-700">{p.monitoring}</strong></span>
                    <span>Autofill: <strong className="text-slate-700">{p.autofill}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy section */}
      <section id="privacy" className="py-20 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
              Privacy & trust
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Clear boundaries, by design
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              We built privacy constraints into the product architecture — not as an afterthought.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">What we store (cloud)</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                {[
                  'Your account email and preferences',
                  'Your monitoring rules and alert channels',
                  'Seat observation data (from public pages)',
                  'Notification delivery records',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-semibold text-white">What we never store</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                {[
                  'Official exam portal passwords',
                  'Active exam platform sessions',
                  'Payment card data (never touched)',
                  'Passport or ID document images',
                  'Your autofill profile (stays in extension)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">FAQ</div>
            <h2 className="text-3xl font-bold text-slate-900">Common questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Will this automatically register me for an exam?',
                a: 'No. ExamSeat Monitor only monitors public seat pages and autofills your personal info locally in your browser. You always manually confirm the form and complete payment yourself. We never auto-submit anything.',
              },
              {
                q: 'Does this work for TCF Canada immigration applications?',
                a: 'Yes. All monitored platforms support TCF Canada, which is one of the accepted French language tests for Canadian immigration and citizenship applications.',
              },
              {
                q: 'Where is my personal information stored?',
                a: 'Your autofill profile (name, address, phone, etc.) is stored exclusively in your Chrome extension\'s local storage on your device. It is never sent to our servers. You can clear it anytime from the extension options page.',
              },
              {
                q: 'How often do you check for seats?',
                a: 'Depending on the platform, we check every 1–5 minutes during normal monitoring. Some platforms allow more frequent checks than others.',
              },
              {
                q: 'Is payment ever automated?',
                a: 'Never. Payment is always completed manually by you. The extension does not read, fill, or interact with payment fields.',
              },
              {
                q: 'Which cities are supported?',
                a: 'Currently Toronto, Vancouver, Montréal, and Québec. More centers will be added based on user demand.',
              },
              {
                q: 'Do I need to share my exam portal login?',
                a: 'No. We only monitor public pages that do not require login. Your exam portal credentials are never requested or stored.',
              },
            ].map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors list-none">
                    {item.q}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4">▾</span>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-100">
                    <div className="pt-4">{item.a}</div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start monitoring today
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join candidates across Canada who stopped missing exam seats.
          </p>
          <Link
            href="/auth?mode=signup"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-base hover:bg-blue-50 transition-colors"
          >
            Create free account
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-blue-200 text-xs mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">ExamSeat Monitor</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 ExamSeat Monitor · TEF / TCF Canada seat tracking assistant ·{' '}
            <a href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</a>
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-300 transition-colors">Dashboard</Link>
            <a href="#faq" className="hover:text-slate-300 transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
