"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, Wallet } from "lucide-react"

interface PaymentMethodSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Method</h3>
      <RadioGroup value={value} onValueChange={onChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`border rounded-lg p-4 cursor-pointer ${value === "online" ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <RadioGroupItem value="online" id="online" className="sr-only" />
          <Label htmlFor="online" className="flex items-start gap-3 cursor-pointer">
            <CreditCard className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <span className="font-medium block mb-1">Online Payment</span>
              <span className="text-sm text-muted-foreground">
                Pay securely through our platform. Your payment will be held until you confirm the service is complete.
              </span>
            </div>
          </Label>
        </div>

        <div
          className={`border rounded-lg p-4 cursor-pointer ${value === "offline" ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <RadioGroupItem value="offline" id="offline" className="sr-only" />
          <Label htmlFor="offline" className="flex items-start gap-3 cursor-pointer">
            <Wallet className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <span className="font-medium block mb-1">Offline Payment</span>
              <span className="text-sm text-muted-foreground">
                Pay the freelancer directly. You'll coordinate payment details with the freelancer after booking.
              </span>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}
