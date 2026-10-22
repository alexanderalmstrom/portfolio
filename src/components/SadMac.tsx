interface SadMacProps {
  onRestart?: () => void
}

// One string per pixel row; X is a filled pixel.
const mac = [
  '.XXXXXXXXXXXXXXXXXXXX.',
  'X....................X',
  'X....................X',
  'X...XXXXXXXXXXXXXX...X',
  'X..X..............X..X',
  'X..X..X.X....X.X..X..X',
  'X..X...X......X...X..X',
  'X..X..X.X....X.X..X..X',
  'X..X......X.......X..X',
  'X..X......XX......X..X',
  'X..X..............X..X',
  'X..X....XXXXXX....X..X',
  'X..X...X......X...X..X',
  'X..X..............X..X',
  'X...XXXXXXXXXXXXXX...X',
  'X....................X',
  'X....................X',
  'X....................X',
  'X..XX.......XXXXXX...X',
  'X....................X',
  'X....................X',
  'X....................X',
  'X....................X',
  '.XXXXXXXXXXXXXXXXXXXX.',
  '..X................X..',
  '..X................X..',
  '..XXXXXXXXXXXXXXXXXX..',
]

export default function SadMac({ onRestart }: SadMacProps) {
  return (
    <div className="fixed top-0 left-0 flex size-full flex-col items-center justify-center overflow-auto bg-black p-8 text-center font-mono text-white motion-safe:animate-fade-in">
      <svg
        className="mb-8 h-32 w-auto flex-none md:h-40"
        viewBox={`0 0 ${mac[0].length} ${mac.length}`}
        shapeRendering="crispEdges"
        fill="currentColor"
        role="img"
        aria-label="Sad Mac">
        {mac.map((row, y) =>
          [...row].map((pixel, x) =>
            pixel == 'X' ? (
              <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
            ) : null,
          ),
        )}
      </svg>
      <p className="mb-0 text-[1.25rem] leading-[1.3] tracking-[0.2em]">
        0000000F
        <br />
        0BADC0DE
      </p>
      <div className="mt-10 max-w-xl text-[0.8125rem] leading-[1.6]">
        <p className="mb-0">
          Sorry, a system error occurred. The chimes of death are sadly not
          supported in this browser.
        </p>
        <p className="mb-0">ID = 02</p>
      </div>
      {onRestart ? (
        <button
          type="button"
          className="mt-10 cursor-pointer rounded-lg border-2 border-white px-6 py-1 text-[0.8125rem] transition-colors hover:bg-white hover:text-black"
          onClick={onRestart}>
          Restart
        </button>
      ) : null}
    </div>
  )
}
