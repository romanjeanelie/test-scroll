import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { throttle } from "lodash";
import { isIOS } from "react-device-detect";
import useScrollDirection from "../hooks/useScrollDirection";

// Styles
import { gsap } from "gsap";
import styles from "./ScrollMobile.module.scss";
import classnames from "classnames";

const useScroll = (options) => {
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

const Card = React.forwardRef(({ index }, ref) => {
  return (
    <div ref={ref} className={styles.card}>
      Card - {index}
    </div>
  );
});

function AnimateSection({ index, color }) {
  //   // State
  const { y } = useScroll({ wait: 100 });
  const [bounds, setBounds] = useState({});
  const [isInView, setIsInView] = useState(false);

  // Ref
  const section = useRef();
  const square = useRef();

  // Effects
  useEffect(() => {
    getBounds();
    // animReset();
  }, []);

  useEffect(() => {
    onScroll();
  }, [y]);

  useEffect(() => {
    // if (isInView) {
    //   animIn();
    // } else {
    //   animOut();
    // }
  }, [isInView]);

  const getBounds = () => {
    setBounds(() => section.current.getBoundingClientRect());
  };

  const onScroll = () => {
    const yValue = section.current.offsetTop - bounds.top;
    // TODO Use height container not window
    const yProgress = yValue / (bounds.height - window.innerHeight);
    checkInView(yProgress);
  };

  const checkInView = (yProgress) => {
    if (yProgress > 0 && yProgress < 1 && !isInView) setIsInView(true);
    if ((yProgress === 0 || yProgress > 1) && isInView) setIsInView(false);
  };

  // Animation
  const animReset = () => {
    gsap.killTweensOf(square.current);

    gsap.set(square.current, {
      opacity: 0,
    });
  };
  const animIn = () => {
    gsap.killTweensOf(square.current);

    gsap.to(square.current, {
      opacity: 1,
    });
  };
  const animOut = () => {
    gsap.killTweensOf(square.current);
    gsap.to(square.current, {
      opacity: 0,
    });
  };
  return (
    <section ref={section} className={classnames(styles.section, styles.animate)}>
      <div
        ref={square}
        className={classnames(styles.square, {
          [styles.inView]: isInView,
        })}
        style={{ backgroundColor: color }}
      >
        animate section - {index}
      </div>
    </section>
  );
}

function Section({ index }) {
  if (index === 2) return <AnimateSection index={index} color={"grey"} />;
  if (index === 3) return <AnimateSection index={index} color={"darkGrey"} />;
  if (index === 4) return <AnimateSection index={index} color={"grey"} />;
  if (index === 5) return <AnimateSection index={index} color={"darkGrey"} />;
  return <section className={styles.section}>section - {index}</section>;
}

export default function ScrollMobile() {
  useEffect(() => {
    if (!isIOS) {
      document.querySelector("html").style.overflowY = "scroll";
      document.querySelector("html").style.height = "100%";
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
