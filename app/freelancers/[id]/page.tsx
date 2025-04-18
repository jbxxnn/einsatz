"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useOptimizedSupabase } from "@/components/optimized-supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FreelancerAvailabilityCalendar from "@/components/freelancer-availability-calendar"
import { toast } from "@/lib/toast"
import { MapPin, Star, Clock, CheckCircle } from "lucide-react"
import Image from "next/image"
import type { Database } from "@/lib/database.types"
import BookingForm from "@/components/booking-form"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type JobOffering = Database["public"]["Tables"]["freelancer_job_offerings"]["Row"] & {
  category_name: string
}

interface FreelancerWithOfferings extends Profile {
  job_offerings: JobOffering[]
  is_available_now: boolean
}

export default function FreelancerProfile() {
  const params = useParams()
  const router = useRouter()
  const { supabase } = useOptimizedSupabase()
  const [freelancer, setFreelancer] = useState<FreelancerWithOfferings | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    const fetchFreelancer = async () => {
      setLoading(true)

      try {
        // Fetch freelancer profile
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", params.id)
          .eq("user_type", "freelancer")
          .single()

        if (error) {
          throw error
        }

        // Fetch job offerings
        const { data: offeringsData, error: offeringsError } = await supabase
          .from("freelancer_job_offerings")
          .select(`
          *,
          job_categories (id, name)
        `)
          .eq("freelancer_id", params.id)

        if (offeringsError) {
          throw offeringsError
        }

        // Format job offerings
        const formattedOfferings = offeringsData.map((offering) => ({
          ...offering,
          category_name: offering.job_categories.name,
        }))

        // Check real-time availability
        const { data: availabilityData } = await supabase
          .from("real_time_availability")
          .select("*")
          .eq("freelancer_id", params.id)
          .eq("is_available_now", true)

        const isAvailableNow = availabilityData && availabilityData.length > 0

        // Set the freelancer with offerings
        setFreelancer({
          ...data,
          job_offerings: formattedOfferings,
          is_available_now: isAvailableNow,
        })
        
        // If there are job offerings, select the first one by default
        if (formattedOfferings.length > 0) {
          setSelectedCategoryId(formattedOfferings[0].category_id)
        }

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
      } catch (error) {
        console.error("Error fetching freelancer:", error)
        toast.error("Failed to load freelancer profile")
        router.push("/freelancers")
      } finally {
        setLoading(false)
      }
    }

    fetchFreelancer()
  }, [supabase, params.id, router])
  
  const getSelectedOffering = () => {
    if (!freelancer || !selectedCategoryId) return null
    return freelancer.job_offerings.find((offering) => offering.category_id === selectedCategoryId)
  }

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
  
  const selectedOffering = getSelectedOffering()

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
              {freelancer.is_available_now && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Available Now
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {freelancer.first_name} {freelancer.last_name}
              </h1>

              <div className="flex justify-between flex-col mt-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="ml-1 font-medium">4.9</span>
                  <span className="text-muted-foreground ml-1">({reviews.length} reviews)</span>
                </div>
                <div>
                {freelancer.location && (
                  <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  <span>
                    Serves clients within {freelancer.service_radius} miles of {freelancer.location}
                  </span>
                </div>
                )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
              {freelancer.job_offerings.map((offering) => (
                  <Badge
                    key={offering.category_id}
                    variant={selectedCategoryId === offering.category_id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategoryId(offering.category_id)}
                  >
                    {offering.category_name}
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

              {/* {freelancer.latitude && freelancer.longitude && freelancer.service_radius && (
                <div className="mt-4">
                  <h2 className="text-xl font-semibold mb-2">Service Area</h2>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    <span>
                      Serves clients within {freelancer.service_radius} miles of {freelancer.location}
                    </span>
                  </div>
                </div>
              )} */}


{/*               
              {selectedOffering && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">{selectedOffering.category_name} Services</h2>
                  <div className="flex items-center mb-2">
                    <p className="text-xl font-bold text-primary">€{selectedOffering.hourly_rate}/hour</p>
                  </div>
                  {selectedOffering.description && (
                    <p className="text-muted-foreground">{selectedOffering.description}</p>
                  )}
                  {selectedOffering.experience_years && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedOffering.experience_years} years of experience
                    </p>
                  )}
                </div>
              )} */}

              {/* <div>
              <h2 className="text-xl font-semibold mb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills?.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                  {(!freelancer.skills || freelancer.skills.length === 0) && (
                    <p className="text-muted-foreground">No skills listed.</p>
                  )}
                </div>
              </div> */}

              <div>
              <h2 className="text-xl font-semibold mb-2">Select a service</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {freelancer.job_offerings.map((offering) => (
                    <Card key={offering.category_id} className="p-4">
                      <CardContent>
                        <h3 className="text-lg font-semibold">{offering.category_name}</h3>
                        <p className="text-primary font-bold">€{offering.hourly_rate}/hour</p>
                        {offering.description && (
                          <p className="text-muted-foreground mt-2">{offering.description}</p>
                        )}
                        {offering.experience_years && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {offering.experience_years} years of experience
                          </p>
                        )}
                        <Button
                          variant={selectedCategoryId === offering.category_id ? "default" : "outline"}
                          className="mt-4 w-full"
                          onClick={() => setSelectedCategoryId(offering.category_id)}
                        >
                          {selectedCategoryId === offering.category_id ? "Selected" : "Select"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* {selectedOffering && (
                  <p className="mt-2 font-medium text-primary">€{selectedOffering.hourly_rate}/hour</p>
                )} */}
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
                    {freelancer.job_offerings.length > 0 && selectedOffering && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Selected service:</p>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold">{selectedOffering.category_name}</h3>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Select a date:</p>
                    <FreelancerAvailabilityCalendar
                      freelancerId={freelancer.id}
                      categoryId={selectedCategoryId}
                      onSelectDate={setSelectedDate}
                    />
                  </div>

                  <Button
                    className="w-full"
                    disabled={!selectedDate || !selectedCategoryId}
                    onClick={() => setShowBookingForm(true)}
                  >
                     Continue to Booking
                  </Button>
                </div>
              ) : (
                <BookingForm
                  freelancer={freelancer}
                  selectedDate={selectedDate}
                  onBack={() => setShowBookingForm(false)}
                  selectedCategoryId={selectedCategoryId}
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

