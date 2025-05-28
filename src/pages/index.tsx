import Link from "next/link";

const BridgeSymbolIcon = ({ className = "w-12 h-12 mx-auto mb-3 text-blue-600 dark:text-blue-400" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 32C8 32 20 16 32 16C44 16 56 32 56 32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 32H60" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
      <path d="M20 32V44" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
      <path d="M44 32V44" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    </svg>
);

const IconCheck = ({ className = "w-8 h-8 text-green-500" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
);

const IconMegaphone = ({ className = "w-8 h-8 text-blue-500" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.083-6.25A1.76 1.76 0 015.882 11H1.76A1.76 1.76 0 010 9.24V5.882a1.76 1.76 0 011.76-1.76h4.122a1.76 1.76 0 011.627.95l2.083 3.125a1.76 1.76 0 001.627.95h4.122a1.76 1.76 0 001.76-1.76V5.882a1.76 1.76 0 00-1.76-1.76H11.76a1.76 1.76 0 00-1.627.95L8.05 5.882M19.24 9H17.6C15.04 9 13 6.96 13 4.4A2.4 2.4 0 0115.4 2h.2c1.325 0 2.4 1.075 2.4 2.4v.2C18 7.325 18.675 9 19.24 9z"></path>
    </svg>
);

const IconNetwork = ({ className = "w-8 h-8 text-purple-500" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
    </svg>
);


export default function Home() {
  return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              КӨПҮРӨ
            </span>
            </Link>
            <nav className="hidden md:flex gap-4 lg:gap-6 items-center">
              <Link href="#how-it-helps" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Как это помогает?</Link>
              <Link href="#your-role" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Ваша роль</Link>
              <Link
                  href="/submit-complaint"
                  className="text-sm font-medium px-3 py-1.5 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors dark:bg-green-600 dark:hover:bg-green-700"
              >
                Подать обращение
              </Link>
              <Link
                  href="/track-complaint"
                  className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Отследить статус
              </Link>
              <button
                  onClick={() => {
                    document.documentElement.classList.toggle('dark');
                    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
                  }}
                  className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
                  aria-label="Toggle dark mode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 7.758a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              </button>
            </nav>
            <div className="md:hidden">
              {/* Мобильное меню можно будет доработать позже */}
              <button className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <section className="text-center py-20 sm:py-32 bg-gradient-to-b from-blue-100 dark:from-blue-900/30 to-slate-50 dark:to-slate-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <BridgeSymbolIcon />
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-blue-700 dark:text-blue-400">
                Ваш Голос Строит Будущее!
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-700 dark:text-slate-300">
                "КӨПҮРӨ" — это мост между вами и позитивными изменениями в Кыргызстане. <br/> Делитесь проблемами в социальных сетях или отправьте обращение напрямую через нашу форму – мы поможем вашему голосу быть услышанным.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                    href="/submit-complaint"
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition-colors transform hover:scale-105"
                >
                  Подать обращение сейчас
                </Link>
                <Link
                    href="#how-it-helps"
                    className="inline-flex items-center justify-center px-8 py-3 border border-blue-600 dark:border-blue-400 text-base font-medium rounded-md text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Узнать, как это работает
                </Link>
              </div>
            </div>
          </section>

          <section id="how-it-helps" className="py-16 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  Как "КӨПҮРӨ" помогает вам?
                </h2>
                <p className="mt-4 max-w-xl mx-auto text-lg text-slate-600 dark:text-slate-400">
                  Мы верим, что каждая проблема заслуживает внимания. Ваша активность – ключ к переменам.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                  <IconMegaphone className="mx-auto mb-4 w-12 h-12 text-blue-500 dark:text-blue-400" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Ваш голос услышан</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Публично делитесь проблемами или отправляйте через форму – "КӨПҮРӨ" анализирует эту информацию.
                  </p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                  <IconNetwork className="mx-auto mb-4 w-12 h-12 text-purple-500 dark:text-purple-400" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Прозрачный процесс</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Мы систематизируем обращения и вы можете отслеживать их статус на пути к решению.
                  </p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                  <IconCheck className="mx-auto mb-4 w-12 h-12 text-green-500 dark:text-green-400" />
                  <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Реальные изменения</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Чем активнее гражданское общество, тем быстрее решаются проблемы и улучшается качество жизни.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="your-role" className="py-16 sm:py-24 bg-blue-600 dark:bg-blue-700 text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Ваша роль – быть активным!
              </h2>
              <p className="max-w-2xl mx-auto text-lg sm:text-xl mb-8 text-blue-100 dark:text-blue-200">
                Не молчите о проблемах! Рассказывайте о них в соцсетях, используйте нашу форму. Каждое ваше сообщение – это шаг к улучшению.
              </p>
              <Link
                  href="/track-complaint"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 dark:text-blue-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors transform hover:scale-105"
              >
                Проверить статус обращения
              </Link>
            </div>
          </section>

          <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-4">
                Наша Миссия
              </h2>
              <BridgeSymbolIcon className="w-16 h-16 mx-auto mb-6 text-blue-600 dark:text-blue-400" />
              <p className="max-w-3xl mx-auto text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                "КӨПҮРӨ" стремится создать прозрачный и эффективный канал коммуникации между гражданами и структурами, ответственными за решение общественных проблем. Мы верим, что современные технологии могут помочь каждому человеку внести свой вклад в позитивные изменения и развитие Кыргызстана. Наша цель – усилить голос каждого гражданина и способствовать построению общества, где проблемы решаются оперативно и справедливо.
              </p>
            </div>
          </section>


        </main>

        <footer className="border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">КӨПҮРӨ</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © {new Date().getFullYear()} Проект "КӨПҮРӨ". <br className="sm:hidden"/> Создано с ❤️ для Кыргызстана.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              techdragons
            </p>
          </div>
        </footer>
        <script
            dangerouslySetInnerHTML={{
              __html: `
            (function() {
              const theme = localStorage.getItem('theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            })();
          `,
            }}
        />
      </div>
  );
}