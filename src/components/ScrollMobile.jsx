import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { throttle } from "lodash";
import { isIOS } from "react-device-detect";
import useScrollDirection from "../hooks/useScrollDirection";
import { useInView } from "react-intersection-observer";

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
  };

  const removeEventListener = () => {
    rootElement.removeEventListener("scroll", onScroll);
  };

  const updateScrollValues = useCallback(() => {
    const y = rootElement.scrollTop;
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

  // const handleScroll = useMemo(
  //   () =>
  //     wait !== 0 ? throttle(() => scrollFunc(), wait) : () => scrollFunc(),
  //   [wait, scrollFunc]
  // );

  return scrollValues;
};

function useArrayRef(ref) {
  const refs = useRef([]);
  refs.current = [];
  return [refs, (ref) => ref && refs.current.push(ref)];
}

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

function AnimateSection() {
  // Config
  const cards = new Array(4).fill();
  const factorMarginBottom = 1;

  // State
  const { y } = useScroll({ wait: 100 });
  const [bounds, setBounds] = useState({});
  const [index, setIndex] = useState({
    current: null,
    prev: null,
  });

  //Refs
  const section = useRef();
  const [cardsRefs, setCardsRefs] = useArrayRef();
  const timeline = useRef(gsap.timeline({ paused: true }));

  // Intersection
  const { ref: inViewRef, inView, entry } = useInView();
  const setRefs = useCallback(
    (node) => {
      section.current = node;
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
    if (inView) {
      animCard(index.current);
    }
  }, [index, inView]);

  const getBounds = () => {
    setBounds(() => section.current.getBoundingClientRect());
  };

  const onScroll = () => {
    const yValue = section.current.offsetTop - bounds.top;
    const yProgress = yValue / bounds.height;
    console.log(section.current.offsetTop, bounds.top, bounds.height);
    // TODO find a better way to handle the max limit
    const currentIndex = Math.min(Math.trunc(yProgress * cards.length), cards.length - 1);
    if (currentIndex !== index.current) {
      setIndex((prev) => ({ current: currentIndex }));
    }
  };

  // Animations
  const animReset = () => {
    gsap.set(`.${styles.card}`, {
      opacity: 0.2,
    });
  };
  const animCard = (index) => {
    // console.log(index);
    gsap.to(cardsRefs.current[index], {
      opacity: 1,
    });
  };

  return (
    <section ref={setRefs} className={classnames(styles.section, styles.animate)}>
      Animate section
      {cards.map((_, i) => (
        <Card ref={setCardsRefs} key={i} index={i} />
      ))}
    </section>
  );
}

function Section({ index }) {
  if (index === 2) return <AnimateSection />;
  return <section className={styles.section}>section - {index}</section>;
}

export default function ScrollMobile() {
  useEffect(() => {
    if (!isIOS) {
      document.querySelector("html").style.overflowY = "scroll";
      document.querySelector("html").style.height = "100%";
    }
  }, []);

  const sections = new Array(6).fill();

  return (
    <>
      <Header />
      {sections.map((el, i) => (
        <Section key={i} index={i} />
      ))}
    </>
  );
}
