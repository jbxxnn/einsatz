"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, XCircle } from "lucide-react"

interface DBAWarningDialogProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  onCancel: () => void
  type: 'no_dba'
  freelancerName?: string
}

export default function DBAWarningDialog({ 
  isOpen, 
  onClose, 
  onProceed, 
  onCancel, 
  type,
  freelancerName = "the freelancer"
}: DBAWarningDialogProps) {
  const isNoDBA = type === 'no_dba'
  
  const config = {
    no_dba: {
      icon: <XCircle className="h-12 w-12 text-red-500" />,
      title: "No DBA Assessment Available",
      badge: { text: "High Risk", variant: "destructive" as const },
      description: `${freelancerName} has not completed their DBA (Declaration of Labor Relations) assessment for this service category yet.`,
      risks: [
        "No compliance assessment available",
        "Higher risk of employment classification issues",
        "Limited legal protection for both parties"
      ],
      proceedText: "Continue at High Risk",
      cancelText: "Contact Freelancer First"
    }
  }
  
  const currentConfig = config[type]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto">
            {currentConfig.icon}
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl font-semibold">
              {currentConfig.title}
            </DialogTitle>
            <Badge variant={currentConfig.badge.variant} className="mx-auto">
              {currentConfig.badge.text}
            </Badge>
          </div>
          <DialogDescription className="text-left space-y-4">
            <p className="text-sm text-muted-foreground">
              {currentConfig.description}
            </p>
            
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Potential Risks:
              </h4>
              <ul className="text-xs space-y-1 ml-6">
                {currentConfig.risks.map((risk, index) => (
                  <li key={index} className="list-disc text-muted-foreground">
                    {risk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border-l-4 border-blue-500">
              <strong>Recommendation:</strong> For the best compliance assessment and legal protection, 
              ask {freelancerName} to {isNoDBA ? "complete" : "update"} their DBA assessment first.
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {currentConfig.cancelText}
          </Button>
          <Button 
            variant={isNoDBA ? "destructive" : "secondary"}
            onClick={onProceed}
            className="w-full sm:w-auto"
          >
            {currentConfig.proceedText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

