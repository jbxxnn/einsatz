'use client'

import { Hero } from "@/components/animated-hero"
import { useTranslation } from "@/lib/i18n"

export default function Home() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] transform bg-white bg-[radial-gradient(60%_120%_at_50%_50%,hsla(0,0%,100%,0)_0,rgba(252,205,238,.5)_100%)]">
      <section className="w-full">
        <Hero 
          title={t("home.hero.title")}
          subtitle={t("home.hero.subtitle")}
          description={t("home.hero.description")}
          findFreelancersText={t("home.hero.findFreelancers")}
          becomeFreelancerText={t("home.hero.becomeFreelancer")}
        />
      </section>
    </div>
  )
}
