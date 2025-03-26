"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/components/ui/use-toast"
import { MapPin, Star, Clock, CheckCircle } from "lucide-react"
import Image from "next/image"
import type { Database } from "@/lib/database.types"
import BookingForm from "@/components/booking-form"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function FreelancerProfile() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [freelancer, setFreelancer] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    const fetchFreelancer = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .eq("user_type", "freelancer")
        .single()

      if (error) {
        console.error("Error fetching freelancer:", error)
        toast({
          title: "Error",
          description: "Could not load freelancer profile",
          variant: "destructive",
        })
        router.push("/freelancers")
      } else {
        setFreelancer(data)

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select(`
            *,
            profiles!reviewer_id(first_name, last_name, avatar_url)
          `)
          .eq("reviewee_id", params.id)
          .order("created_at", { ascending: false })

        setReviews(reviewsData || [])
      }

      setLoading(false)
    }

    fetchFreelancer()
  }, [supabase, params.id, router, toast])

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!freelancer) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Freelancer not found</h1>
        <Button onClick={() => router.push("/freelancers")}>Back to Freelancers</Button>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Freelancer Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative h-40 w-40 rounded-lg overflow-hidden">
              <Image
                src={
                  freelancer.avatar_url ||
                  `/placeholder.svg?height=160&width=160&text=${freelancer.first_name || "Freelancer"}`
                }
                alt={`${freelancer.first_name} ${freelancer.last_name}`}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {freelancer.first_name} {freelancer.last_name}
              </h1>

              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="ml-1 font-medium">4.9</span>
                  <span className="text-muted-foreground ml-1">({reviews.length} reviews)</span>
                </div>

                {freelancer.location && (
                  <div className="flex items-center ml-4">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-muted-foreground">{freelancer.location}</span>
                  </div>
                )}
              </div>

              {freelancer.hourly_rate && (
                <div className="mt-3">
                  <span className="text-xl font-bold text-primary">€{freelancer.hourly_rate}</span>
                  <span className="text-muted-foreground">/hour</span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {freelancer.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-4 mt-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">About</h2>
                <p className="text-muted-foreground whitespace-pre-line">{freelancer.bio || "No bio provided."}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Availability</h2>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Available for bookings</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 mt-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden">
                            <Image
                              src={review.profiles?.avatar_url || `/placeholder.svg?height=40&width=40`}
                              alt={`${review.profiles?.first_name || "User"}`}
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {review.profiles?.first_name} {review.profiles?.last_name}
                                </p>
                                <div className="flex items-center mt-1">
                                  {Array(5)
                                    .fill(0)
                                    .map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                                        }`}
                                      />
                                    ))}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="mt-2 text-muted-foreground">{review.comment}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Booking Section */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Book {freelancer.first_name}</h2>

              {!showBookingForm ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Select a date:</p>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="border rounded-md"
                      disabled={(date) => date < new Date()}
                    />
                  </div>

                  <Button className="w-full" disabled={!selectedDate} onClick={() => setShowBookingForm(true)}>
                    Continue to Booking
                  </Button>
                </div>
              ) : (
                <BookingForm
                  freelancer={freelancer}
                  selectedDate={selectedDate}
                  onBack={() => setShowBookingForm(false)}
                />
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3">Why book with Einsatz</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                  <span className="text-sm">Secure payments, released only when you approve</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                  <span className="text-sm">Verified professionals with reviews</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-2 shrink-0" />
                  <span className="text-sm">24/7 customer support</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

