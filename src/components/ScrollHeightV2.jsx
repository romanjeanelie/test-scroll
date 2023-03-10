import React, { useEffect, useState, useRef, useCallback } from "react";
// import { useScroll } from "./ScrollMobile";
import useScrollDirection from "../hooks/useScrollDirection";
import { SCROLL_UP, SCROLL_DOWN } from "../hooks/useScrollDirection";
import { clamp, isEmpty } from "lodash";
import { useInView } from "react-intersection-observer";
import { isIOS, isMobile } from "react-device-detect";

// Styles
import styles from "./ScrollHeight.module.scss";
import classnames from "classnames";
import { gsap } from "gsap";

function useArrayRef() {
  const refs = useRef([]);
  refs.current = [];
  return [refs, (ref) => ref && refs.current.push(ref)];
}

const sections = [
  {
    key: 0,
    height: 100,
  },
  {
    key: 1,
    height: 300,
  },
  {
    key: 2,
    height: 100,
  },
  {
    key: 3,
    height: 100,
  },
  {
    key: 4,
    height: 100,
  },
];

const useScroll = () => {
  // State
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollValues, setScrollValues] = useState({
    y: 0,
    yProgress: 0,
  });

  // Refs
  const timeOut = useRef();

  useEffect(() => {
    addEventListeners();
    return () => removeEventListeners();
  }, []);

  const addEventListeners = () => {
    window.addEventListener("scroll", onScroll);
  };
  const removeEventListeners = () => {
    window.removeEventListener("scroll", onScroll);
  };

  const onScroll = () => {
    checkIsScrolling();
    updateScrollValues();
  };

  const checkIsScrolling = () => {
    setIsScrolling(true);
    clearTimeout(timeOut.current);
    timeOut.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  };

  const updateScrollValues = useCallback(() => {
    const y = window.pageYOffset;
    setScrollValues(() => ({
      y,
    }));
  }, []);

  return { isScrolling, scrollValues };
};

const AnimateSection = ({ index, isIntersect }) => {
  const { scrollValues } = useScroll();

  // Ref
  const sectionRef = useRef();

  useEffect(() => {
    updateAnimateSection();
  }, [scrollValues]);

  useEffect(() => {
    if (isIntersect) {
      onIntersectIn();
    } else {
      animOut();
    }
  }, [isIntersect]);

  const updateAnimateSection = () => {
    const { y } = scrollValues;
    const yProgress = clamp((y - index * window.innerHeight) / window.innerHeight, 0, 1);
    // const opacity = Math.cos((yProgress * 2 - 1) * Math.PI);
    // const opacity = yProgress;
    // sectionRef.current.style.opacity = opacity;
  };

  // Animations
  const animIn = () => {
    gsap.to(sectionRef.current, {
      opacity: 1,
    });
  };
  const animOut = () => {
    gsap.to(sectionRef.current, {
      opacity: 0,
    });
  };

  return (
    <div ref={sectionRef} className={classnames(styles.section, styles.animateSection)}>
      Animate section - {index}
    </div>
  );
};

const Section = ({ index, height, onIntersectIn }) => {
  const isAnimated = index === 1;
  const { isScrolling, scrollValues } = useScroll();
  const { y } = scrollValues;

  // State
  const [bounds, setBounds] = useState(null);
  const [isIntersect, setIsIntersect] = useState(false);

  // Ref
  const sectionRef = useRef();

  useEffect(() => {
    getBounds();
  }, []);

  useEffect(() => {
    if (!bounds || isMobile) return;
    updateSectionHeight();
  }, [scrollValues, bounds, isScrolling]);

  useEffect(() => {
    if (isMobile) return;
    if (isIntersect) {
      onIntersectIn();
    }
  }, [isIntersect]);

  const getBounds = () => {
    setBounds(() => sectionRef.current.getBoundingClientRect());
  };

  const getProgress = () => {
    const previousHeight =
      (sections.slice(0, index).reduce((acc, curr) => acc + curr.height, 0) / 100) * window.innerHeight;
    return (y - previousHeight) / bounds.height;
  };

  const updateSectionHeight = () => {
    const yProgress = getProgress();

    const yProgressClamped = clamp(yProgress, 0, 1);
    const yProgressClampedByHeight = ((1 - yProgressClamped) * height) / height;

    if (index === 4) {
      //   console.log({ yProgress });
    }

    updateHeight(yProgressClamped);
    checkIntersect(yProgressClamped);
  };

  const updateHeight = (yProgress) => {
    // TODO write it better
    const newHeight = Math.min((((1 - yProgress) * height) / 100) * window.innerHeight, window.innerHeight);
    console.log();
    sectionRef.current.style.height = `${newHeight}px`;
  };

  const checkIntersect = (yProgress) => {
    const isActive = yProgress > 0 && yProgress < 1;

    if (!isIntersect && isActive) {
      setIsIntersect(true);
    }
    if (isIntersect && !isActive) {
      setIsIntersect(false);
    }
  };

  return (
    <>
      <div ref={sectionRef} className={classnames(styles.section, { [styles.isAnimated]: isAnimated })}>
        section - {index}
      </div>
      {/* {isAnimated && <AnimateSection index={index} isIntersect={isIntersect} />} */}
    </>
  );
};

function ScrollHeight() {
  const nbSections = 8;

  const direction = useScrollDirection();
  const { isScrolling, scrollValues } = useScroll();

  // State
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    if (isMobile) return;
    const totalHeight = sections.reduce((acc, curr) => acc + curr.height, 0);
    document.body.style.height = totalHeight + "vh";
  }, [isMobile]);

  useEffect(() => {
    if (!isScrolling && !isMobile) {
      onScrollUp();
    }
  }, [isScrolling, direction]);

  const onScrollUp = () => {
    // TODO prevent for section animated
    // const indexTarget = direction === SCROLL_DOWN ? activeSection + 1 : activeSection;
    const indexTarget = activeSection;
    const { y } = scrollValues;
    const yProgress = y / window.innerHeight;

    goToSection(indexTarget);
  };

  // TODO write it better
  const getHeightTarget = (indexTarget) => {
    let result;
    const newArr = [...sections];

    result = newArr.slice(0, indexTarget).reduce((acc, curr) => acc + curr.height, 0);
    result = (result / 100) * window.innerHeight;

    return result;
  };

  const goToSection = (indexTarget) => {
    const heightTarget = getHeightTarget(indexTarget);
    window.scrollTo({ top: heightTarget, behavior: "smooth" });
  };

  return (
    <>
      {[...sections].reverse().map((el, i) => (
        <Section key={el.key} index={el.key} height={el.height} onIntersectIn={() => setActiveSection(el.key)} />
      ))}
    </>
  );
}

export default ScrollHeight;
