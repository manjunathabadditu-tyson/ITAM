interface ContentContainerProps {
  children: React.ReactNode
}

export default function ContentContainer({ children }: ContentContainerProps) {
  return (
    <div className="w-full">
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-8 m-10">
        {children}
      </div>
    </div>
  )
}
