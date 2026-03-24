import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { motion, useInView, AnimatePresence, useScroll, useTransform } from "framer-motion";
import mediaConfig from "./mediaConfig";
import "./App.css";

/* ── Audio Context (shared so videos can duck the bg music) ── */
const AudioContext_ = createContext(null);

function useAudio() {
  const audioRef = useRef(null);
  const playingRef = useRef(false);
  const duckedRef = useRef(false);

  const init = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.src = "/media/bg-music.mp3";
      a.loop = true;
      a.volume = 0.35;
      a.preload = "auto";
      // iOS needs webkit audio session hint
      a.setAttribute("playsinline", "");
      audioRef.current = a;
    }
  }, []);

  const start = useCallback(() => {
    init();
    playingRef.current = true;
    // iOS: must be called directly in user gesture handler
    const playPromise = audioRef.current.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Retry once on next user interaction
        const retry = () => {
          audioRef.current.play().catch(() => {});
          document.removeEventListener("touchstart", retry);
          document.removeEventListener("click", retry);
        };
        document.addEventListener("touchstart", retry, { once: true });
        document.addEventListener("click", retry, { once: true });
      });
    }
  }, [init]);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) { stop(); return false; }
    else { start(); return true; }
  }, [start, stop]);

  const duck = useCallback(() => {
    if (audioRef.current && !duckedRef.current) {
      duckedRef.current = true;
      // Fade out smoothly
      const fade = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.02) {
          audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.03);
        } else {
          clearInterval(fade);
          if (audioRef.current) audioRef.current.volume = 0;
        }
      }, 30);
    }
  }, []);

  const unduck = useCallback(() => {
    if (audioRef.current && duckedRef.current) {
      duckedRef.current = false;
      // Fade back in smoothly
      const fade = setInterval(() => {
        if (audioRef.current && audioRef.current.volume < 0.33) {
          audioRef.current.volume = Math.min(0.35, audioRef.current.volume + 0.02);
        } else {
          clearInterval(fade);
          if (audioRef.current) audioRef.current.volume = 0.35;
        }
      }, 40);
    }
  }, []);

  return { start, stop, toggle, duck, unduck, playingRef };
}

/* ── Splash Screen ── */
function Splash({ onStart }) {
  const [stars] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`,
      size: `${1 + Math.random() * 3}px`,
    }))
  );

  return (
    <motion.div className="splash" onClick={onStart}>
      <div className="splash-glow" />
      <div className="splash-glow splash-glow--2" />
      <motion.div
        className="splash-stars"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 2 }}
      >
        {stars.map((s) => (
          <div
            key={s.id}
            className="star"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              animationDuration: s.duration,
              width: s.size,
              height: s.size,
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="splash-ring"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 0.5, duration: 2, ease: "easeOut" }}
      />

      <motion.h1
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
      >
        Happy Birthday Mum!🎉
      </motion.h1>
      <motion.p
        className="splash-subtitle"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 1 }}
      >
        A celebration of you
      </motion.p>
      <motion.button
        className="play-btn"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.8, type: "spring" }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Play"
      >
        <div className="play-btn-ring" />
        <svg width="28" height="32" viewBox="0 0 28 32" fill="none">
          <path d="M2 1.5L26.5 16L2 30.5V1.5Z" fill="#d4a055" stroke="#d4a055" strokeWidth="2" />
        </svg>
      </motion.button>
      <motion.p
        className="tap-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2, duration: 1 }}
      >
        Tap to begin
      </motion.p>
    </motion.div>
  );
}

/* ── Scroll Prompt ── */
function ScrollPrompt() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 100) setVisible(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="scroll-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.div
            className="scroll-prompt-line"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 1.8, duration: 0.6 }}
          />
          <p>Swipe up</p>
          <motion.div
            className="scroll-arrow"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a055" strokeWidth="2" strokeLinecap="round">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Hero Section ── */
function Hero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1, 0.92]);

  return (
    <section className="section hero" ref={ref}>
      <div className="hero-bg-glow" />
      <motion.div
        className="hero-content"
        style={{ opacity, scale }}
      >
        <motion.div
          className="hero-ornament"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
        />
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          Happy Birthday<br />Mum!🎉
        </motion.h1>
        <motion.div
          className="divider"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        />
        <motion.p
          className="hero-year"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
        >
          2 0 2 6
        </motion.p>
        <motion.div
          className="hero-ornament"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.div>
      <ScrollPrompt />
    </section>
  );
}

/* ── Photo Section ── */
function PhotoSection({ src, caption, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const directions = ["left", "right", "bottom", "right", "left"];
  const dir = directions[index % 5];

  const initial = {
    opacity: 0,
    x: dir === "left" ? -100 : dir === "right" ? 100 : 0,
    y: dir === "bottom" ? 80 : 0,
    scale: 0.85,
    rotate: dir === "left" ? -3 : dir === "right" ? 3 : 0,
  };

  return (
    <section className="section photo-section" ref={ref}>
      <motion.div
        className="photo-frame"
        style={{ y: parallaxY }}
        initial={initial}
        animate={inView ? { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="photo-shimmer" />
        <div className="photo-border" />
        <img src={src} alt={caption || "Photo"} loading="lazy" />
        {caption && (
          <motion.div
            className="caption"
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {caption}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

/* ── Video Section ── */
function VideoSection({ src, caption, unmute }) {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const inView = useInView(ref, { amount: 0.5 });
  const appeared = useRef(false);
  const sectionInView = useInView(ref, { once: true, amount: 0.2 });
  const audio = useContext(AudioContext_);
  const [soundActive, setSoundActive] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (inView) {
      appeared.current = true;
      // Always start muted for autoplay (iOS requirement)
      videoRef.current.muted = true;
      videoRef.current.play().then(() => {
        // After play starts, unmute if flagged (works because user tapped splash)
        if (unmute) {
          videoRef.current.muted = false;
          setSoundActive(true);
          audio?.duck();
        }
      }).catch(() => {});
    } else if (appeared.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      if (unmute) {
        videoRef.current.muted = true;
        setSoundActive(false);
        audio?.unduck();
      }
    }
  }, [inView, unmute, audio]);

  // Tap to toggle sound on iOS if autoplay unmute fails
  const handleTap = () => {
    if (!unmute || !videoRef.current) return;
    const isMuted = videoRef.current.muted;
    videoRef.current.muted = !isMuted;
    setSoundActive(isMuted);
    if (isMuted) audio?.duck();
    else audio?.unduck();
  };

  return (
    <section className="section video-section" ref={ref}>
      <motion.div
        className={`video-frame ${unmute ? "video-frame--featured" : ""}`}
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={sectionInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        {unmute && (
          <motion.div
            className="video-sound-badge"
            onClick={handleTap}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#d4a055" style={{ marginRight: 6 }}>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0012 8.5v1.5a3 3 0 010 4V15.5a4.5 4.5 0 004.5-3.5z" />
            </svg>
            {soundActive ? "Sound on" : "Tap for sound"}
          </motion.div>
        )}
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="metadata"
          onClick={handleTap}
        />
        {caption && <div className="video-caption">{caption}</div>}
      </motion.div>
    </section>
  );
}

/* ── Text Interlude Section ── */
function TextSection({ message }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  // Split message into words for staggered reveal
  const words = message.split(" ");

  return (
    <section className="section text-section" ref={ref}>
      <motion.div className="text-ornament-container">
        <motion.div
          className="text-ornament"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <p className="message">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="message-word"
              initial={{ opacity: 0, y: 15 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
            >
              {word}{" "}
            </motion.span>
          ))}
        </p>
        <motion.div
          className="text-ornament"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
      </motion.div>
    </section>
  );
}

/* ── Finale ── */
function Finale() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section className="section finale" ref={ref}>
      <div className="finale-glow" />
      <div className="finale-glow finale-glow--2" />
      <motion.div
        className="finale-text"
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.4, ease: "easeOut" }}
      >
        <motion.h2
          initial={{ opacity: 0, scale: 0.85 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          Happy Birthday, Mum!
        </motion.h2>
        <motion.div
          className="divider divider--wide"
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.7 }}
        >
          Thank you for being the most amazing, loving, and beautiful mother in
          the world. Today we celebrate you and everything you mean to us.
        </motion.p>
        <motion.div
          className="finale-hearts"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            &#x2764;
          </motion.span>
        </motion.div>
        <motion.p
          className="finale-from"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.6 } : {}}
          transition={{ duration: 1, delay: 1.3 }}
        >
          With all our love
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ── Scroll Progress ── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div className="progress-bar" style={{ width: `${progress}%` }} />;
}

/* ── Floating Particles & Embers ── */
function Particles() {
  const [particles] = useState(() => {
    const dots = Array.from({ length: 40 }, (_, i) => ({
      id: `dot-${i}`,
      type: "dot",
      left: `${Math.random() * 100}%`,
      duration: `${8 + Math.random() * 14}s`,
      delay: `${Math.random() * 20}s`,
      size: `${1.5 + Math.random() * 3}px`,
      opacity: 0.15 + Math.random() * 0.35,
    }));

    const embers = Array.from({ length: 25 }, (_, i) => ({
      id: `ember-${i}`,
      type: "ember",
      left: `${Math.random() * 100}%`,
      duration: `${6 + Math.random() * 10}s`,
      delay: `${Math.random() * 15}s`,
      size: `${2 + Math.random() * 4}px`,
      opacity: 0.3 + Math.random() * 0.5,
      drift: `${-30 + Math.random() * 60}px`,
    }));

    const flames = Array.from({ length: 15 }, (_, i) => ({
      id: `flame-${i}`,
      type: "flame",
      left: `${10 + Math.random() * 80}%`,
      duration: `${4 + Math.random() * 6}s`,
      delay: `${Math.random() * 12}s`,
      size: `${3 + Math.random() * 5}px`,
      opacity: 0.2 + Math.random() * 0.4,
    }));

    return [...dots, ...embers, ...flames];
  });

  return (
    <div className="particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`particle particle--${p.type}`}
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
            "--particle-opacity": p.opacity,
            "--particle-drift": p.drift || "0px",
          }}
        />
      ))}
    </div>
  );
}

/* ── App ── */
export default function App() {
  const [started, setStarted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const audio = useAudio();

  const handleStart = () => {
    setStarted(true);
    audio.start();
  };

  const handleToggle = () => {
    const nowPlaying = audio.toggle();
    setMusicOn(nowPlaying);
  };

  let photoIndex = 0;

  return (
    <AudioContext_.Provider value={audio}>
      <AnimatePresence>
        {!started && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Splash onStart={handleStart} />
          </motion.div>
        )}
      </AnimatePresence>

      {started && (
        <>
          <ScrollProgress />
          <Particles />

          <button
            className="audio-toggle show"
            onClick={handleToggle}
            aria-label="Toggle Music"
          >
            {musicOn ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#d4a055">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0012 8.5v1.5a3 3 0 010 4V15.5a4.5 4.5 0 004.5-3.5zM14 3.23v2.06a7 7 0 010 13.42v2.06A9 9 0 0014 3.23z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#d4a055">
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
                <line x1="18" y1="9" x2="24" y2="15" stroke="#d4a055" strokeWidth="2" />
                <line x1="24" y1="9" x2="18" y2="15" stroke="#d4a055" strokeWidth="2" />
              </svg>
            )}
          </button>

          <Hero />

          {mediaConfig.map((item, i) => {
            if (item.type === "photo") {
              const pi = photoIndex++;
              return <PhotoSection key={i} src={item.src} caption={item.caption} index={pi} />;
            }
            if (item.type === "video") {
              return <VideoSection key={i} src={item.src} caption={item.caption} unmute={item.unmute} />;
            }
            if (item.type === "text") {
              return <TextSection key={i} message={item.message} />;
            }
            return null;
          })}

          <Finale />
        </>
      )}
    </AudioContext_.Provider>
  );
}
