"use client"

import { useState, useMemo, useCallback } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, isAfter, addMonths } from "date-fns"
import { CalendarIcon, Clock, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, HelpCircle, Dot, Loader } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useAvailabilityData, useAvailabilityMutation, useDeleteAvailability, type AvailabilityEntry } from "@/hooks/use-availability"
import LoadingSpinner from "@/components/loading-spinner"
import { cn } from "@/lib/utils"

type AvailabilityCalendarProps = {
  freelancerId: string
}

export default function AvailabilityCalendar({ freelancerId }: AvailabilityCalendarProps) {
  const { t } = useTranslation()
  const [date, setDate] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<AvailabilityEntry | null>(null)

  // Form state
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrencePattern, setRecurrencePattern] = useState<string>("weekly")
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(addMonths(new Date(), 3))
  const [certaintyLevel, setCertaintyLevel] = useState<"guaranteed" | "tentative" | "unavailable">("guaranteed")

  // React Query hooks
  const { availability, datesWithAvailability, isLoading, error } = useAvailabilityData(freelancerId)
  const saveMutation = useAvailabilityMutation()
  const deleteMutation = useDeleteAvailability()

  // Get availability entries for selected date
  const selectedDateEntries = useMemo(() => {
    const dateKey = format(date, "yyyy-MM-dd")
    return datesWithAvailability.get(dateKey)?.entries || []
  }, [date, datesWithAvailability])

  // Enhanced calendar modifiers with better visual indicators
  const calendarModifiers = useMemo(() => {
    const modifiers: Record<string, (date: Date) => boolean> = {}
    
    datesWithAvailability.forEach((dateData, dateKey) => {
      // Create modifier for each date with availability
      modifiers[`date-${dateKey}`] = (date: Date) => {
        return format(date, "yyyy-MM-dd") === dateKey
      }
      
      // Create status-specific modifiers
      const hasGuaranteed = dateData.entries.some((entry: any) => entry.certainty_level === "guaranteed")
      const hasTentative = dateData.entries.some((entry: any) => entry.certainty_level === "tentative")
      const hasUnavailable = dateData.entries.some((entry: any) => entry.certainty_level === "unavailable")
      
      if (hasGuaranteed) {
        modifiers[`guaranteed-${dateKey}`] = (date: Date) => format(date, "yyyy-MM-dd") === dateKey
      }
      if (hasTentative) {
        modifiers[`tentative-${dateKey}`] = (date: Date) => format(date, "yyyy-MM-dd") === dateKey
      }
      if (hasUnavailable) {
        modifiers[`unavailable-${dateKey}`] = (date: Date) => format(date, "yyyy-MM-dd") === dateKey
      }
    })
    
    return modifiers
  }, [datesWithAvailability])

  // Enhanced calendar modifier class names with dots
  const calendarModifierClassNames = useMemo(() => {
    const classNames: Record<string, string> = {}
    
    datesWithAvailability.forEach((dateData, dateKey) => {
      const hasGuaranteed = dateData.entries.some((entry: any) => entry.certainty_level === "guaranteed")
      const hasTentative = dateData.entries.some((entry: any) => entry.certainty_level === "tentative")
      const hasUnavailable = dateData.entries.some((entry: any) => entry.certainty_level === "unavailable")
      
      // Base class for dates with availability
      let baseClass = "relative"
      
      // Add dot indicator based on status
      if (hasGuaranteed) {
        classNames[`guaranteed-${dateKey}`] = `${baseClass} after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-2 after:h-2 after:bg-green-500 after:rounded-full`
      } else if (hasTentative) {
        classNames[`tentative-${dateKey}`] = `${baseClass} after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-2 after:h-2 after:bg-amber-500 after:rounded-full`
      } else if (hasUnavailable) {
        classNames[`unavailable-${dateKey}`] = `${baseClass} after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:transform after:-translate-x-1/2 after:w-2 after:h-2 after:bg-gray-400 after:rounded-full`
      }
      
      // Add event indicator dot for any availability
      if (dateData.entries.length > 0) {
        classNames[`date-${dateKey}`] = baseClass
      }
    })
    
    return classNames
  }, [datesWithAvailability])

  // Reset form state
  const resetForm = useCallback(() => {
    setStartDate(new Date())
    setEndDate(new Date())
    setStartTime("09:00")
    setEndTime("17:00")
    setIsRecurring(false)
    setRecurrencePattern("weekly")
    setRecurrenceEndDate(addMonths(new Date(), 3))
    setCertaintyLevel("guaranteed")
    setSelectedEntry(null)
  }, [])

  // Open dialog for adding new availability
  const handleAddAvailability = useCallback(() => {
    resetForm()
    setStartDate(date)
    setEndDate(date)
    setIsDialogOpen(true)
  }, [date, resetForm])

  // Open dialog for editing existing availability
  const handleEditAvailability = useCallback((entry: AvailabilityEntry) => {
    setSelectedEntry(entry)
    setIsRecurring(entry.is_recurring)
    setRecurrencePattern(entry.recurrence_pattern || "weekly")
    setRecurrenceEndDate(entry.recurrence_end_date ? new Date(entry.recurrence_end_date) : undefined)
    setCertaintyLevel(entry.certainty_level)

    const startDateTime = new Date(entry.start_time)
    const endDateTime = new Date(entry.end_time)

    setStartDate(startDateTime)
    setEndDate(endDateTime)
    setStartTime(format(startDateTime, "HH:mm"))
    setEndTime(format(endDateTime, "HH:mm"))

    setIsDialogOpen(true)
  }, [])

  // Delete availability entry
  const handleDeleteAvailability = useCallback(async (entryId: string) => {
    deleteMutation.mutate({ freelancerId, entryId })
  }, [deleteMutation, freelancerId])

  // Save availability entry
  const handleSaveAvailability = useCallback(async () => {
      // Validate form
      if (!startDate || !endDate || !startTime || !endTime) {
      // Show validation error
        return
      }

      // Create start and end datetime objects
      const startDateTime = new Date(startDate)
      const [startHours, startMinutes] = startTime.split(":").map(Number)
      startDateTime.setHours(startHours, startMinutes, 0, 0)

      const endDateTime = new Date(endDate)
      const [endHours, endMinutes] = endTime.split(":").map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)

      // Validate time range
      if (isAfter(startDateTime, endDateTime)) {
      // Show validation error
        return
      }

      const availabilityData: Omit<AvailabilityEntry, "id"> = {
        freelancer_id: freelancerId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate.toISOString() : null,
        certainty_level: certaintyLevel,
      }

    saveMutation.mutate({
      freelancerId,
      availabilityData,
      entryId: selectedEntry?.id
    })

      setIsDialogOpen(false)
      resetForm()
  }, [
    startDate, endDate, startTime, endTime, isRecurring, recurrencePattern, 
    recurrenceEndDate, certaintyLevel, freelancerId, selectedEntry?.id, 
    saveMutation, resetForm
  ])

  // Get status for a specific date
  const getDateStatus = useCallback((date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd")
    const dateData = datesWithAvailability.get(dateKey)

    if (!dateData) return null

    // Determine the highest priority status for the day
    let status = "unavailable"

    dateData.entries.forEach((entry: AvailabilityEntry) => {
      if (entry.certainty_level === "guaranteed") {
        status = "guaranteed"
      } else if (entry.certainty_level === "tentative" && status !== "guaranteed") {
        status = "tentative"
      }
    })

    return status
  }, [datesWithAvailability])

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <Loader className="h-8 w-8 text-muted-foreground animate-spin" />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{t("availability.error.failedToLoadAvailability")}</p>
              <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                {t("availability.error.retry")}
              </Button>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
      
          <div className="space-y-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="w-full"
                modifiers={calendarModifiers}
                modifiersClassNames={calendarModifierClassNames}
                
              />

              <div className="p-4 rounded-lg">
                <h4 className="font-medium text-xs mb-3">{t("availability.legend.title")}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 flex items-center justify-center">
                    </div>
                  <span className="text-xs">{t("availability.status.guaranteed")}</span>
                </div>
                  {/* <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-amber-500 flex items-center justify-center">
                    </div>
                  <span className="text-xs">{t("availability.status.tentative")}</span>
                </div> */}
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-gray-400 flex items-center justify-center">
                    </div>
                  <span className="text-xs">{t("availability.status.unavailable")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-black">{format(date, "EEEE, MMMM d, yyyy")}</h3>
                <Button onClick={handleAddAvailability} size="sm" className="text-xs">
                  <Plus className="mr-1 h-4 w-4" />
                  {t("availability.actions.add")}
                </Button>
              </div>

              {selectedDateEntries.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-xs text-black">{t("availability.noAvailability")}</p>
                  <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={handleAddAvailability}>
                    {t("availability.actions.addAvailability")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("availability.table.time")}</TableHead>
                        <TableHead>{t("availability.table.recurrence")}</TableHead>
                        <TableHead>{t("availability.table.status")}</TableHead>
                        <TableHead className="text-right">{t("availability.table.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                  {selectedDateEntries.map((entry: AvailabilityEntry, index: number) => (
                        <TableRow key={entry.id || index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-black" />
                              <span className="font-medium text-black">
                                {format(new Date(entry.start_time), "h:mm a")} -{" "}
                                {format(new Date(entry.end_time), "h:mm a")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.is_recurring ? (
                              <div className="flex items-center gap-2 text-xs text-black">
                                <RefreshCw className="h-3 w-3" />
                                <span>
                                  {t("availability.recurrence.repeats", {
                                    pattern: t(`availability.recurrence.patterns.${entry.recurrence_pattern}`),
                                    endDate: entry.recurrence_end_date
                                      ? format(new Date(entry.recurrence_end_date), "MMM d, yyyy")
                                      : ""
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-black">{t("availability.table.oneTime")}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {entry.certainty_level === "guaranteed" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : entry.certainty_level === "tentative" ? (
                                <HelpCircle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-gray-400" />
                              )}
                                <span className="text-xs capitalize">{t(`availability.status.${entry.certainty_level}`)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleEditAvailability(entry)}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-pencil"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => entry.id && handleDeleteAvailability(entry.id)}
                                disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-black" />
                            </Button>
                          </div>
                          </TableCell>
                        </TableRow>
                  ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
          </div>
          
      {/* Add/Edit Availability Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? t("availability.dialog.editTitle") : t("availability.dialog.addTitle")}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="date-time">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="date-time">{t("availability.dialog.dateTimeTab")}</TabsTrigger>
              <TabsTrigger value="recurrence">{t("availability.dialog.recurrenceTab")}</TabsTrigger>
            </TabsList>

            <TabsContent value="date-time" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">{t("availability.dialog.startDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="start-date" variant="outline" className="w-full justify-start text-left font-normal text-xs bg-white text-black hover:bg-white">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : t("availability.dialog.selectDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">{t("availability.dialog.endDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="end-date" variant="outline" className="w-full justify-start text-left font-normal text-xs bg-white text-black hover:bg-white">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : t("availability.dialog.selectDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">{t("availability.dialog.startTime")}</Label>
                  <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="text-xs" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">{t("availability.dialog.endTime")}</Label>
                  <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="text-xs" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certainty">{t("availability.dialog.status")}</Label>
                <Select value={certaintyLevel} onValueChange={(value) => setCertaintyLevel(value as any)}>
                  <SelectTrigger id="certainty" className="text-xs">
                    <SelectValue placeholder={t("availability.dialog.selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guaranteed">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                        {t("availability.status.guaranteed")}
                      </div>
                    </SelectItem>
                    {/* <SelectItem value="tentative">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-amber-500" />
                        {t("availability.status.tentative")}
                      </div>
                    </SelectItem> */}
                    <SelectItem value="unavailable">
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-gray-300" />
                        {t("availability.status.unavailable")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="recurrence" className="space-y-4 pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked === true)}
                />
                <Label htmlFor="is-recurring">{t("availability.dialog.repeatAvailability")}</Label>
              </div>

              {isRecurring && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="recurrence-pattern">{t("availability.dialog.repeatPattern")}</Label>
                    <Select value={recurrencePattern} onValueChange={setRecurrencePattern} disabled={!isRecurring}>
                      <SelectTrigger id="recurrence-pattern" className="text-xs">
                        <SelectValue placeholder={t("availability.dialog.selectPattern")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{t("availability.recurrence.patterns.weekly")}</SelectItem>
                        <SelectItem value="biweekly">{t("availability.recurrence.patterns.biweekly")}</SelectItem>
                        <SelectItem value="monthly">{t("availability.recurrence.patterns.monthly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrence-end">{t("availability.dialog.endRecurrence")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="recurrence-end"
                          variant="outline"
                          className="w-full justify-start text-left font-normal text-xs"
                          disabled={!isRecurring}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : t("availability.dialog.noEndDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={recurrenceEndDate}
                          onSelect={setRecurrenceEndDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-xs">
              {t("common.cancel")}
            </Button>
            <Button 
              onClick={handleSaveAvailability}
              disabled={saveMutation.isPending}
              className="text-xs"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                </>
              ) : (
                selectedEntry ? t("common.save") : t("common.save")
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

