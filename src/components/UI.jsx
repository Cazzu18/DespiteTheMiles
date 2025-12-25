import { atom, useAtom } from "jotai";
import { useEffect, useRef } from "react";

const pictures = [
  "eddoksmomtrin",
  "momeddest",
  "herlong",
  "noblegrad",
  "tiatio",
  "babyeddest",
  "mombabyed",
  "edmundandtrin",
  "doks",
  "momedtrin",
  "destanded",
  "primos",
  "momanddoks",
  "edsilly",
  "momkissed",
  "trinkissed",
];

export const pageAtom = atom(0);
export const pages = [
  {
    front: "book-cover",
    back: pictures[0],
  },
];
for (let i = 1; i < pictures.length - 1; i += 2) {
  pages.push({
    front: pictures[i % pictures.length],
    back: pictures[(i + 1) % pictures.length],
  });
}

pages.push({
  front: pictures[pictures.length - 1],
  back: "book-back",
});

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const bgAudioRef = useRef(null);
  const bgStartedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/audios/TheChristmasSong.mp3");
    audio.loop = true;
    audio.volume = 0.04;
    bgAudioRef.current = audio;

    return () => {
        audio.pause();
        audio.src ="";
        bgAudioRef.current = null;
        bgStartedRef.current = false;
    };
  }, []);

  const startBgAudio = () => {
    if(bgStartedRef.currenty) return;
    const audio = bgAudioRef.current;

    if(!audio) return;//couldnt find it(maybe should throw error)

    bgStartedRef.current = true;
    audio.play().catch(() => {
        bgStartedRef.current = false;
    });
  };

  useEffect(() => {
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play();
  }, [page]); //play audio when page changes

  return (
    <>
      <main className=" pointer-events-none select-none z-10 fixed  inset-0  flex justify-between flex-col">
        <a
          className="pointer-events-auto mt-10 ml-10"
          href="https://github.com/Cazzu18"
        >
          <img className="w-20" src="/images/edmundlongsworth-white.png" />
        </a>
        <div className="w-full overflow-auto pointer-events-auto flex justify-center">
          <div className="overflow-auto flex items-center gap-4 max-w-full p-10">
            {[...pages].map((_, index) => (
              <button
                key={index}
                className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                  index === page
                    ? "bg-white/90 text-black"
                    : "bg-black/30 text-white"
                }`}
                onClick={() => {setPage(index); startBgAudio();}}
              >
                {index === 0 ? "Cover" : `Page ${index}`}
              </button>
            ))}
            <button
              className={`border-transparent hover:border-white transition-all duration-300  px-4 py-3 rounded-full  text-lg uppercase shrink-0 border ${
                page === pages.length
                  ? "bg-white/90 text-black"
                  : "bg-black/30 text-white"
              }`}
              onClick={() =>{ startBgAudio(); setPage(pages.length);}}
            >
              Back Cover
            </button>
          </div>
        </div>
      </main>

      <div className="fixed inset-0 flex items-center -rotate-2 select-none">
        <div className="relative">
          <div className="bg-white/0  animate-horizontal-scroll flex items-center gap-8 w-max px-8">
            <h1 className="shrink-0 text-white text-10xl font-black ">
              I
            </h1>
            <h2 className="shrink-0 text-white text-8xl italic font-light">
              Really
            </h2>
            <h2 className="shrink-0 text-white text-12xl font-bold">
              Miss
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              And
            </h2>
            <h2 className="shrink-0 text-white text-9xl font-medium">
              Love
            </h2>
            <h2 className="shrink-0 text-white text-9xl font-extralight italic">
              You
            </h2>
            <h2 className="shrink-0 text-white text-13xl font-bold">
              Guys
            </h2>
            <h2 className="shrink-0 text-transparent text-13xl font-bold outline-text italic">
              So Much
            </h2>
          </div>
          <div className="absolute top-0 left-0 bg-white/0 animate-horizontal-scroll-2 flex items-center gap-8 px-8 w-max">
            <h1 className="shrink-0 text-white text-10xl font-black ">
              I
            </h1>
            <h2 className="shrink-0 text-white text-8xl italic font-light">
              Really
            </h2>
            <h2 className="shrink-0 text-white text-12xl font-bold">
              Miss
            </h2>
            <h2 className="shrink-0 text-transparent text-12xl font-bold italic outline-text">
              And
            </h2>
            <h2 className="shrink-0 text-white text-9xl font-medium">
              Love
            </h2>
            <h2 className="shrink-0 text-white text-9xl font-extralight italic">
              You
            </h2>
            <h2 className="shrink-0 text-white text-13xl font-bold">
              Guys
            </h2>
            <h2 className="shrink-0 text-transparent text-13xl font-bold outline-text italic">
              So Much
            </h2>
          </div>
        </div>
      </div>
    </>
  );
};