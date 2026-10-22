interface BlueScreenProps {
  onRestart?: () => void
}

export default function BlueScreen({ onRestart }: BlueScreenProps) {
  return (
    <div className="fixed top-0 left-0 flex size-full items-center overflow-auto bg-[#0078d7] p-8 [font-family:Segoe_UI,Selawik,Helvetica_Neue,Arial,sans-serif] font-light text-white motion-safe:animate-fade-in md:p-24">
      <div className="max-w-3xl">
        <p className="mb-6 text-[6rem] leading-none md:mb-10 md:text-[9rem]">
          :(
        </p>
        <p className="text-[1.375rem] leading-[1.4] md:text-[1.875rem]">
          This website ran into a problem and needs to lie down. We&apos;re just
          collecting some error info, and then we&apos;ll pretend this never
          happened.
        </p>
        <p className="text-[1.375rem] md:text-[1.875rem]">
          0% complete (and not going anywhere)
        </p>
        <div className="mt-10 text-[0.875rem] leading-[1.6]">
          <p>
            For more information about this issue and possible fixes, try
            turning it off and on again.
          </p>
          <p className="mb-0">
            If you call a support person, give them this info (they won&apos;t
            know either):
          </p>
          <p className="mb-0">Stop code: CRITICAL_PROCESS_DIED</p>
        </div>
        {onRestart ? (
          <button
            type="button"
            className="mt-10 cursor-pointer border border-white px-6 py-2 text-[0.875rem] transition-colors hover:bg-white hover:text-[#0078d7]"
            onClick={onRestart}>
            Turn it off and on again
          </button>
        ) : null}
      </div>
    </div>
  )
}
