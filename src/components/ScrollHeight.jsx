import React, { useEffect, useState, useRef, useCallback } from "react";
// import { useScroll } from "./ScrollMobile";
import useScrollDirection from "../hooks/useScrollDirection";
import { SCROLL_UP, SCROLL_DOWN } from "../hooks/useScrollDirection";
import { clamp } from "lodash";
import { useInView } from "react-intersection-observer";
import { isIOS, isSafari } from "react-device-detect";

// Styles
import styles from "./ScrollHeight.module.scss";
import classnames from "classnames";
import { gsap } from "gsap";

function useArrayRef() {
  const refs = useRef([]);
  refs.current = [];
  return [refs, (ref) => ref && refs.current.push(ref)];
}

const useScroll = () => {
  // State
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollValues, setScrollValues] = useState({
    y: 0,
    yProgress: 0,
  });
  const [scrollDir, setScrollDir] = useState(null);

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
    // const yProgress = (rootElement.scrollTop + rootElement.offsetHeight) / rootElement.scrollHeight;
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
      animIn();
    } else {
      animOut();
    }
  }, [isIntersect]);

  const updateAnimateSection = () => {
    const { y } = scrollValues;
    const yProgress = clamp((y - index * window.innerHeight) / window.innerHeight, 0, 1);
    // const opacity = Math.cos((yProgress * 2 - 1) * Math.PI);
    // const opacity = yProgress;
    // console.log({ opacity });
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

const Section = ({ index }) => {
  const isAnimated = index === 1 || index === 2;
  const { scrollValues } = useScroll();

  // State
  const [bounds, setBounds] = useState({});
  const [isIntersect, setIsIntersect] = useState(false);

  // Ref
  const sectionRef = useRef();

  useEffect(() => {
    updateSectionHeight();
  }, [scrollValues]);

  const updateSectionHeight = () => {
    const { y } = scrollValues;
    const yProgress = (y - index * window.innerHeight) / window.innerHeight;
    const height = clamp(yProgress, 0, 1);
    sectionRef.current.style.height = `${100 - height * 100}vh`;

    const progressVisible = yProgress + 1;

    if ((yProgress < 0 || yProgress > 0) && isIntersect) {
      setIsIntersect(false);
    }

    if (progressVisible > 0 && progressVisible < 1 && !isIntersect) {
      setIsIntersect(true);
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
  //   const sections = new Array(nbSections).fill().reverse();
  const sections = Array.from(Array(nbSections).keys()).reverse();
  const direction = useScrollDirection();
  const { isScrolling, scrollValues } = useScroll();

  useEffect(() => {
    document.body.style.height = 100 * nbSections + "vh";
  }, []);

  useEffect(() => {
    if (!isScrolling) {
      updateSections();
    }
  }, [isScrolling, direction]);

  const updateSections = () => {
    const { y } = scrollValues;
    const yProgress = y / window.innerHeight;

    const indexSection = direction === SCROLL_DOWN ? Math.ceil(yProgress) : Math.floor(yProgress);
    goToSection(indexSection);
  };

  const goToSection = (index) => {
    const targetY = index * window.innerHeight;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <>
      {sections.map((el, i) => (
        <Section key={i} index={el} />
      ))}
    </>
  );
}

export default ScrollHeight;
