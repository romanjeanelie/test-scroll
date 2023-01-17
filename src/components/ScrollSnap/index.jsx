import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { throttle } from "lodash";
import { isSafari, isDesktop, isFirefox } from "react-device-detect";
import { useInView } from "react-intersection-observer";

// Styles
import { gsap } from "gsap";
import classnames from "classnames";
import styles from "./index.module.scss";

const isMobile = window.innerWidth < 750;
const sections = [
  {
    key: 0,
    label: "Intro",
    background: "#eee",
  },
  {
    key: 1,
    label: "Cover",
    background: "#D1D1D3",
  },
  {
    key: 2,
    label: "Film",
    background: "#eee",
  },
  {
    key: 3,
    label: "Duo",
    background: "#D1D1D3",
  },
  {
    key: 4,
    label: "Ingredient 1",
    background: "#eee",
  },
  {
    key: 5,
    label: "Ingredient 2",
    background: "#eee",
  },
  {
    key: 6,
    label: "Ingredient 3",
    background: "#eee",
  },
  {
    key: 7,
    label: "Ingredient 4",
    background: "#eee",
  },
  {
    key: 8,
    label: "Products A",
    background: "#D1D1D3",
  },
  {
    key: 9,
    label: "Artists",
    background: "#eee",
  },
  {
    key: 10,
    label: "Newsletter",
    background: "#D1D1D3",
  },
];

export const SCROLL_UP = "up";
export const SCROLL_DOWN = "down";

const useScrollDirection = ({ initialDirection = SCROLL_DOWN, thresholdPixels = 64 } = {}) => {
  const [scrollDir, setScrollDir] = useState(initialDirection);

  useEffect(() => {
    const threshold = thresholdPixels || 0;
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.pageYOffset || document.body.scrollTop;

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        // We haven't exceeded the threshold
        ticking = false;
        return;
      }

      setScrollDir(scrollY > lastScrollY ? SCROLL_DOWN : SCROLL_UP);
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    document.body.addEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll);

    return () => {
      document.body.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [initialDirection, thresholdPixels]);

  return scrollDir;
};

export const useScroll = (options) => {
  const { wait } = useMemo(
    () => ({
      wait: 250,
      ...options,
    }),
    [options]
  );

  const [scrollValues, setScrollValues] = useState({
    y: 0,
    yProgress: 0,
  });

  const updateScrollValues = useCallback(() => {
    const y = window.pageYOffset || document.body.scrollTop;
    const yProgress = (document.body.scrollTop + document.body.offsetHeight) / document.body.scrollHeight;
    setScrollValues(() => ({
      y,
      yProgress,
    }));
  }, []);

  const onScroll = useMemo(
    () => (wait !== 0 ? throttle(() => updateScrollValues(), wait) : () => updateScrollValues()),
    [updateScrollValues, wait]
  );

  const addEventListener = () => {
    document.body.addEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll);
  };

  const removeEventListener = () => {
    document.body.removeEventListener("scroll", onScroll);
    window.removeEventListener("scroll", onScroll);
  };

  useEffect(() => {
    addEventListener();
    return () => removeEventListener();
  });

  return scrollValues;
};

function Header() {
  const direction = useScrollDirection();

  // Refs
  const header = useRef();

  useEffect(() => {
    if (direction === "up") {
      header.current.classList.add(styles.expand);
    } else {
      header.current.classList.remove(styles.expand);
    }
  }, [direction]);
  return (
    <header ref={header} className={styles.header}>
      Header
    </header>
  );
}

function AnimateSection({ options }) {
  const { label, background } = options;
  // TODO improve it
  const index = options.key - 4;
  const urlVideo = `https://test-scroll-seven.vercel.app/assets/video/${index + 1}.mp4`;

  const { y } = useScroll({ wait: 100 });

  //   // State
  const [bounds, setBounds] = useState(null);
  const [isInView, setIsInView] = useState(false);

  // Ref
  const sectionMarker = useRef();
  const sectionFixed = useRef();

  // Intersect
  const { ref: inViewRef, inView } = useInView({ threshold: 0.99 });

  const setRefs = useCallback(
    (node) => {
      sectionMarker.current = node;
      inViewRef(node);
    },
    [inViewRef]
  );

  const getBounds = () => {
    setBounds(() => sectionMarker.current.getBoundingClientRect());
  };

  const checkInView = (yProgress) => {
    if (yProgress > 0 && yProgress < 1 && !isInView) setIsInView(true);

    // TODO improve it
    if (index === 3) {
      if ((yProgress === 0 || yProgress === (1 / 3) * 2) && isInView) {
        setIsInView(false);
      }
    }
    if ((yProgress === 0 || yProgress >= 1) && isInView) setIsInView(false);
  };

  const onScroll = () => {
    const yValue = isMobile
      ? gsap.utils.clamp(0, bounds.height, y - bounds.top)
      : sectionMarker.current.offsetTop - bounds.top;
    const yProgress = yValue / bounds.height;

    checkInView(yProgress);
  };

  useEffect(() => {
    if (!bounds) return;
    onScroll();
  }, [y, bounds]);

  // Animation
  const animReset = () => {
    gsap.killTweensOf(sectionFixed.current);
    gsap.set(sectionFixed.current, {
      autoAlpha: 0,
    });
  };
  const animIn = () => {
    gsap.killTweensOf(sectionFixed.current);
    gsap.to(sectionFixed.current, {
      autoAlpha: 1,
    });
  };
  const animOut = () => {
    gsap.killTweensOf(sectionFixed.current);
    gsap.to(sectionFixed.current, {
      autoAlpha: 0,
    });
  };

  useEffect(() => {
    getBounds();
    animReset();
  }, []);

  useEffect(() => {
    if (index === 0 && inView) {
      animIn();
    } else if (isInView) {
      animIn();
    } else {
      animOut();
    }
  }, [isInView, inView, index]);

  return (
    <>
      <section
        ref={setRefs}
        className={classnames(styles.section, styles.marker, {
          [styles.first]: index === 0,
          [styles.last]: index === 3,
        })}
      />
      <section ref={sectionFixed} className={classnames(styles.fixed)} style={{ background }}>
        <div className={styles.videoContainer}>
          <video src={urlVideo} autoPlay playsInline muted />
        </div>
        <p>{label}</p>
      </section>
    </>
  );
}

function Section({ options }) {
  const { label, background } = options;

  if (label.includes("Ingredient")) {
    return <AnimateSection options={options} />;
  }

  return (
    <section className={styles.section} style={{ background }}>
      {label}
    </section>
  );
}

export default function ScrollSnap() {
  useEffect(() => {
    document.querySelector("html").style.scrollSnapType = "y mandatory";
    document.body.style.scrollSnapType = "y mandatory";
    document.body.style.height = "100%";
    document.body.style.overflowY = "scroll";

    // Prevent blocking scroll when page is reloaded
    if (!isMobile) {
      document.querySelector("html").style.overflowY = "scroll";
      document.querySelector("html").style.height = "100%";
    }
    // Prevent blocking scroll up on Safari
    if ((isSafari || isFirefox) && isDesktop) {
      document.querySelector("html").style.scrollSnapType = "y proximity";
      document.body.style.scrollSnapType = "y proximity";
    }
  }, []);

  return (
    <>
      <Header />
      {sections.map((el) => (
        <Section key={el.key} options={el} />
      ))}
    </>
  );
}
