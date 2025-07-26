import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link"
import { MoveRight, PhoneCall, LayoutDashboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useOptimizedUser } from "@/components/optimized-user-provider";

interface HeroProps {
  title: string
  subtitle: string
  description: string
  findFreelancersText: string
  becomeFreelancerText: string
}

export function Hero({
  title,
  subtitle,
  description,
  findFreelancersText,
  becomeFreelancerText,
}: HeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);
  const { profile, isProfileLoading, isLoading } = useOptimizedUser();
  const titles = useMemo(
    () => ["amazing", "new", "wonderful", "beautiful", "smart"],
    []
  );
  const { t } = useTranslation();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  const renderButtons = () => {
    // Don't show anything while anything is loading
    if (isLoading || isProfileLoading) {
      return null;
    }

    // Show appropriate buttons based on user type
    if (!profile) {
      return (
        <div className="flex flex-row gap-3">
          <Link href="/freelancers">
            <Button size="lg" className="gap-4" variant="outline">
              {findFreelancersText} <PhoneCall className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/register?type=freelancer">
            <Button size="lg" className="gap-4">
              {becomeFreelancerText} <MoveRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      );
    }

    if (profile.user_type === "freelancer") {
      return (
        <div className="flex flex-row gap-3">
          <Link href="/dashboard">
            <Button size="lg" className="gap-4">
              {t("home.hero.goToDashboard")} <LayoutDashboard className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-row gap-3">
        <Link href="/freelancers">
          <Button size="lg" className="gap-4">
            {findFreelancersText} <PhoneCall className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          {/* <div>
            <Button variant="secondary" size="sm" className="gap-4">
            {t("home.hero.bookLocalFreelancers")} <MoveRight className="w-4 h-4" />
            </Button>
          </div> */}
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-spektr-cyan-50">{title}</span>
              {/* <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span> */}
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
            {description}
            </p>
          </div>
          {renderButtons()}
        </div>
      </div>
    </div>
  );
}
