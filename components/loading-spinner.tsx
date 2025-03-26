export default function LoadingSpinner({ size = "default" }: { size?: "small" | "default" | "large" }) {
    const sizeClasses = {
      small: "h-4 w-4 border-2",
      default: "h-8 w-8 border-3",
      large: "h-12 w-12 border-4",
    }
  
    return (
      <div className="flex justify-center items-center">
        <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`}></div>
      </div>
    )
  }
  
  