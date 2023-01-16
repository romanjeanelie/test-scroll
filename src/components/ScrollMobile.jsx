import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { throttle } from "lodash";
import { isIOS, isSafari, isDesktop } from "react-device-detect";
import { useInView } from "react-intersection-observer";

// Styles
import { gsap } from "gsap";
import styles from "./ScrollMobile.module.scss";
import classnames from "classnames";

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
  const { wait, rootElement } = useMemo(
    () => ({
      wait: 250,
      rootElement: document.body,
      ...options,
    }),
    [options]
  );

  const [scrollValues, setScrollValues] = useState({
    y: 0,
    yProgress: 0,
  });

  useEffect(() => {
    addEventListener();
    return () => removeEventListener();
  });

  const addEventListener = () => {
    rootElement.addEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll);
  };

  const removeEventListener = () => {
    rootElement.removeEventListener("scroll", onScroll);
    window.removeEventListener("scroll", onScroll);
  };

  const updateScrollValues = useCallback(() => {
    const y = window.pageYOffset || rootElement.scrollTop;
    const yProgress = (rootElement.scrollTop + rootElement.offsetHeight) / rootElement.scrollHeight;
    setScrollValues(() => ({
      y,
      yProgress,
    }));
  }, []);

  const onScroll = useMemo(
    () => (wait !== 0 ? throttle(() => updateScrollValues(), wait) : () => updateScrollValues()),
    [updateScrollValues]
  );

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

function AnimateSection({ index, color }) {
  const { y } = useScroll({ wait: 100 });

  //   // State
  const [bounds, setBounds] = useState({});
  const [isInView, setIsInView] = useState(false);

  // Ref
  const sectionMarker = useRef();
  const sectionFixed = useRef();
  const logDiv = useRef();

  // Intersect
  const { ref: inViewRef, inView } = useInView({ threshold: 0.99 });

  const setRefs = useCallback(
    (node) => {
      sectionMarker.current = node;
      inViewRef(node);
    },
    [inViewRef]
  );

  // Effects
  useEffect(() => {
    getBounds();
    animReset();
  }, []);

  useEffect(() => {
    onScroll();
  }, [y]);

  useEffect(() => {
    if (index === 0 && inView) {
      animIn();
    } else {
      if (isInView) {
        animIn();
      } else {
        animOut();
      }
    }
  }, [isInView, inView]);

  const getBounds = () => {
    setBounds(() => sectionMarker.current.getBoundingClientRect());
  };

  const onScroll = () => {
    const yValue = isIOS
      ? gsap.utils.clamp(0, bounds.height, y - bounds.top)
      : sectionMarker.current.offsetTop - bounds.top;
    const yProgress = yValue / bounds.height;
    checkInView(yProgress);
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
  return (
    <>
      <div
        ref={logDiv}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 10,
        }}
      ></div>
      <section
        ref={setRefs}
        className={classnames(styles.section, styles.marker, {
          [styles.first]: index === 0,
          [styles.last]: index === 3,
        })}
      ></section>
      <section ref={sectionFixed} className={classnames(styles.fixed)}>
        <div className={styles.videoContainer}>
          <video src={`assets/video/${index + 1}.mp4`} autoPlay playsInline muted />
        </div>
        <p>fixed section - {index}</p>
      </section>
    </>
  );
}

function Section({ index }) {
  if (index === 2) return <AnimateSection index={0} />;
  if (index === 3) return <AnimateSection index={1} />;
  if (index === 4) return <AnimateSection index={2} />;
  if (index === 5) return <AnimateSection index={3} />;
  return <section className={styles.section}>section - {index}</section>;
}

export default function ScrollMobile() {
  useEffect(() => {
    // Prevent blocking scroll when page is reloaded
    if (!isIOS) {
      document.querySelector("html").style.overflowY = "scroll";
      document.querySelector("html").style.height = "100%";
    }
    // Prevent blocking scroll up on Safari
    if (isSafari && isDesktop) {
      document.querySelector("html").style.scrollSnapType = "y proximity";
      document.body.style.scrollSnapType = "y proximity";
    }
  }, []);

  const sections = new Array(8).fill();

  return (
    <>
      <Header />
      {sections.map((el, i) => (
        <Section key={i} index={i} />
      ))}
    </>
  );
}
