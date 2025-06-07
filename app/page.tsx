'use client'

import { Hero } from "@/components/animated-hero"
import { useTranslation } from "@/lib/i18n"
import { PhoneCall, Calendar, Shield, Users, Clock, Star, CheckCircle, MapPin, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useFreelancers } from "@/lib/data-fetching"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/lib/database.types"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { useEffect, useState } from "react"

type Freelancer = Database["public"]["Tables"]["profiles"]["Row"] & {
  job_offerings?: Array<{
    id: string
    category_name: string
  }>
  rating?: number
  distance?: number
  is_available_now?: boolean
}

export default function Home() {
  const { t } = useTranslation()
  const { data, error, isLoading } = useFreelancers({})
  const freelancers = data?.freelancers || []
  const [profile, setProfile] = useState<any>(null);
  const { supabase } = useOptimizedSupabase();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, [supabase]);

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

      {/* Why Einsatz Section - Only show for non-freelancers */}
      {profile?.user_type !== "freelancer" && (
        <section className="w-full py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{t("home.whyEinsatz.title")}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("home.whyEinsatz.subtitle")}
              </p>
            </div>

            {/* Example Freelancer Cards */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  // Loading skeletons
                  [...Array(12)].map((_, i) => (
                    <Card key={i} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Skeleton className="h-3 w-3" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : error ? (
                  <div className="col-span-full text-center text-muted-foreground">
                    {t("common.error")}
                  </div>
                ) : freelancers.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground">
                    {t("freelancers.results.none")}
                  </div>
                ) : (
                  freelancers.slice(0, 12).map((freelancer: Freelancer) => (
                    <Card key={freelancer.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={freelancer.avatar_url || "/placeholder.svg"} alt={`${freelancer.first_name} ${freelancer.last_name}`} />
                              <AvatarFallback>{freelancer.first_name?.[0]}{freelancer.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-medium">{freelancer.first_name} {freelancer.last_name}</h3>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">{freelancer.rating || "4.5"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {freelancer.job_offerings?.slice(0, 2).map((offering) => (
                              <Badge key={offering.id} variant="secondary">
                                {offering.category_name}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{freelancer.location || "Location not specified"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* See All Freelancers Button */}
              <div className="flex justify-center mt-8">
                <Link href="/freelancers">
                  <Button size="lg" variant="outline">
                    {t("common.findFreelancers")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 items-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t("home.whyEinsatz.trustBadges.verifiedProfessionals")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t("home.whyEinsatz.trustBadges.securePayments")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t("home.whyEinsatz.trustBadges.support")}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="w-full py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">{t("home.features.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <PhoneCall className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("home.features.instant.title")}</h3>
              <p className="text-muted-foreground">{t("home.features.instant.description")}</p>
            </div>
            <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("home.features.scheduling.title")}</h3>
              <p className="text-muted-foreground">{t("home.features.scheduling.description")}</p>
            </div>
            <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("home.features.secure.title")}</h3>
              <p className="text-muted-foreground">{t("home.features.secure.description")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      {/* <section className="w-full py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">1000+</h3>
              <p className="text-muted-foreground">{t("home.stats.freelancers")}</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">5000+</h3>
              <p className="text-muted-foreground">{t("home.stats.jobs")}</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">98%</h3>
              <p className="text-muted-foreground">{t("home.stats.satisfaction")}</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">24/7</h3>
              <p className="text-muted-foreground">{t("home.stats.support")}</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="w-full py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">{t("home.cta.title")}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">{t("home.cta.description")}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/register?type=client">
              <Button size="lg" variant="secondary">
                {t("home.cta.findFreelancer")}
              </Button>
            </Link>
            <Link href="/register?type=freelancer">
              <Button size="lg" variant="outline" className="bg-transparent">
                {t("home.cta.becomeFreelancer")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
