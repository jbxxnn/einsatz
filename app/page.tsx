'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Clock, MapPin, Shield, Star } from "lucide-react"
import { Hero } from "@/components/animated-hero"
import FeaturedFreelancers from "@/components/featured-freelancers"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] transform bg-white bg-[radial-gradient(60%_120%_at_50%_50%,hsla(0,0%,100%,0)_0,rgba(252,205,238,.5)_100%)]">


    {/* <div> */}
    {/* <div className="absolute top-0 z-[-2] h-screen w-screen rotate-180 transform bg-white bg-[radial-gradient(60%_120%_at_50%_50%,hsla(0,0%,100%,0)_0,rgba(252,205,238,.5)_100%)]"></div> */}
      {/* Animated Hero Section */}
      
      <section className="w-full">
        <Hero />
      </section>

      {/* Featured Freelancers */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Featured Freelancers</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl">
                Discover top-rated professionals ready to help
              </p>
            </div>
          </div>
          <FeaturedFreelancers />
          <div className="flex justify-center mt-8">
            <Link href="/freelancers">
              <Button variant="outline" size="lg">
                View All Freelancers
              </Button>
            </Link>
          </div>
        </div>
      </section> */}


      {/* Hero Section */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Book Local Freelancers Instantly
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Einsatz connects you with skilled professionals for urgent, in-person jobs. No job postings, just
                  direct booking.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/freelancers">
                  <Button size="lg" className="gap-1">
                    Find Freelancers <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register?type=freelancer">
                  <Button size="lg" variant="outline">
                    Join as Freelancer
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative lg:ml-auto">
              <Image
                src="/placeholder.svg?height=550&width=550"
                width={550}
                height={550}
                alt="Freelancer working"
                className="mx-auto aspect-square rounded-lg object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section> */}

      {/* How It Works */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">How Einsatz Works</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl">
                Book skilled professionals in three simple steps
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
            <div className="flex flex-col items-center space-y-3 rounded-lg border p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Find</h3>
              <p className="text-center text-muted-foreground">Browse profiles of skilled freelancers in your area</p>
            </div>
            <div className="flex flex-col items-center space-y-3 rounded-lg border p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Book</h3>
              <p className="text-center text-muted-foreground">Select a time and instantly book the freelancer</p>
            </div>
            <div className="flex flex-col items-center space-y-3 rounded-lg border p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Pay Securely</h3>
              <p className="text-center text-muted-foreground">
                Payment is held until job completion and your approval
              </p>
            </div>
          </div>
        </div>
      </section> */}

      {/* Featured Freelancers */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Featured Freelancers</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl">
                Discover top-rated professionals ready to help
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
                <div className="relative">
                  <Image
                    src={`/placeholder.svg?height=200&width=400&text=Freelancer ${i}`}
                    width={400}
                    height={200}
                    alt={`Freelancer ${i}`}
                    className="aspect-[2/1] w-full object-cover"
                  />
                </div>
                <div className="flex flex-col space-y-1.5 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold">Alex Johnson</h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="ml-1 text-sm font-medium">4.9</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Electrician</p>
                  <div className="flex items-center pt-2">
                    <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Berlin, Germany</span>
                  </div>
                  <p className="pt-2 text-sm">Available for emergency repairs, installations, and maintenance.</p>
                  <div className="flex justify-between items-center pt-4">
                    <p className="font-semibold">€45/hour</p>
                    <Link href={`/freelancers/${i}`}>
                      <Button size="sm">View Profile</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Link href="/freelancers">
              <Button variant="outline" size="lg">
                View All Freelancers
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      {/* Testimonials */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">What Our Users Say</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl">
                Hear from clients and freelancers who use Einsatz
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col justify-between rounded-lg border p-6 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center">
                    {Array(5)
                      .fill(0)
                      .map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                  </div>
                  <p className="text-muted-foreground">
                    "I needed an emergency plumber on a Sunday evening. Within 30 minutes of booking on Einsatz, a
                    professional was at my door. Incredible service!"
                  </p>
                </div>
                <div className="flex items-center pt-4">
                  <div className="h-10 w-10 rounded-full bg-muted">
                    <Image
                      src="/placeholder.svg?height=40&width=40"
                      width={40}
                      height={40}
                      alt="User"
                      className="rounded-full"
                    />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">Sarah M.</p>
                    <p className="text-xs text-muted-foreground">Client</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to Get Started?</h2>
              <p className="max-w-[900px] md:text-xl">
                Join Einsatz today and connect with skilled professionals or find new clients
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/register?type=client">
                <Button size="lg" variant="secondary" className="gap-1">
                  Sign Up as Client
                </Button>
              </Link>
              <Link href="/register?type=freelancer">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Join as Freelancer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  )
}
