import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { throttle } from "lodash";
import { isIOS, isSafari, isDesktop, isFirefox } from "react-device-detect";
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
  return (
    <section className={styles.section}>
      section - {index}
      {index === 0 && (
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Facilis, reiciendis. Eos obcaecati placeat odit
          itaque! Fugiat pariatur laborum voluptatum sunt voluptas quasi quibusdam. Numquam itaque facere ea possimus
          asperiores aspernatur sit iure eveniet ratione? Voluptatum eos perferendis corporis doloribus corrupti eaque
          ipsam, impedit sunt. Ducimus officia aspernatur quasi distinctio ullam unde ipsum ipsam excepturi dicta atque
          perferendis recusandae eaque sed modi aperiam illo numquam corporis, fugiat odit. Asperiores delectus ea ab
          modi fugiat, aspernatur libero pariatur explicabo ut optio minima autem deserunt labore illum fuga, facilis
          rem totam temporibus architecto quidem ipsa? Asperiores non cum quaerat tempora impedit temporibus, minus,
          tempore, culpa architecto accusantium repellat ipsa aspernatur nam sunt! Dolor amet blanditiis itaque magnam
          adipisci modi illo quis doloribus laborum, aliquid, soluta quos maxime nam ut cum dolorem obcaecati ullam!
          Illum consectetur sapiente similique officiis sunt dolorum excepturi ratione at! Id placeat aliquid, quidem,
          fugiat earum distinctio, eos eaque unde facere nobis dolore rerum at! Nam ipsam consectetur rerum tempora
          veritatis amet eius quas maiores, quod hic possimus molestias accusantium sit mollitia blanditiis, animi
          minima, esse error. Animi nisi cumque nostrum necessitatibus nemo, expedita temporibus consectetur sunt, quia
          harum praesentium. Itaque rerum, velit sed, aliquid asperiores molestias facere debitis ducimus perferendis ea
          est veniam consectetur non nemo commodi iste reiciendis odit assumenda cupiditate. Nemo repellendus modi at
          culpa cupiditate id quasi vitae et cum facilis dicta, molestias libero fugit, sequi perferendis eligendi dolor
          hic nobis totam aliquid temporibus. Sunt iste natus labore dolores illo cumque pariatur nulla quisquam quasi?
          Libero tempora reiciendis doloribus dolore ex optio ut velit distinctio. Ullam, nesciunt unde! Itaque iste,
          quas dolor nam consequuntur ut aspernatur dolorem, cupiditate ipsum eaque tempore nobis iure totam error.
          Magni earum odio dolores, sunt, ipsa est voluptatibus qui praesentium illo natus animi enim voluptas veniam?
          Praesentium iusto numquam soluta distinctio placeat deleniti autem rem quidem ratione veniam a ut, corrupti
          nam sunt id debitis labore necessitatibus omnis? Magnam dolor dignissimos consectetur numquam sint molestiae
          eius repellat doloribus temporibus laudantium placeat incidunt maxime ratione inventore ipsa pariatur, dicta,
          velit nisi ea recusandae. Iure nihil harum laborum id esse nesciunt, aliquam doloribus sunt velit? Placeat,
          suscipit praesentium enim non consectetur beatae, ducimus velit omnis laboriosam provident, aut dolores odio!
          Laborum dolorum iste quam temporibus dolor ducimus tenetur placeat, voluptatum at tempora sed consequatur ex
          rerum. Assumenda inventore ipsa quisquam officia, ipsam officiis corporis sed quaerat voluptatibus nemo quia
          exercitationem similique quis sunt perferendis at, reiciendis aliquam praesentium ea eaque, voluptas
          cupiditate! Facere magnam veritatis eaque ipsam! Impedit ad quidem qui odit, eos amet! Ea error rem nemo,
          fugit ducimus saepe, soluta blanditiis ipsam cupiditate sunt mollitia nesciunt quisquam. Tenetur, laboriosam
          nulla. Mollitia ea modi qui sapiente veniam rem. Unde nulla repellendus facere veniam illo impedit eveniet
          reiciendis quasi nesciunt ad. Cumque qui dolore quos magnam rerum. Aut, fuga vero nemo sapiente autem eveniet
          dolorem culpa repellat dolores inventore nobis quasi ut voluptas sunt atque doloremque, numquam soluta? Cum
          dolores eum quasi animi esse eveniet iste laboriosam labore deleniti harum! Adipisci eveniet distinctio ullam
          reiciendis dolores, vitae a nisi nam debitis nihil voluptates. Illum inventore voluptatum excepturi
          cupiditate, doloribus molestias totam sapiente voluptas provident nihil harum libero, aperiam hic placeat!
          Veritatis eum distinctio sed. Deleniti, reiciendis. Quam, consectetur quas. Cumque inventore assumenda
          eligendi vel debitis adipisci sit amet similique accusantium quaerat iste perspiciatis perferendis sapiente
          consequatur facere deleniti dolore libero voluptatem, alias est, quisquam voluptatum unde quis! In, natus? A
          similique architecto enim mollitia ipsa ducimus quas, non ipsum quod qui pariatur magnam voluptatem odit
          cupiditate quaerat consequatur sit doloribus consectetur! Et odit obcaecati non error dignissimos
          necessitatibus culpa accusantium deserunt optio quisquam maxime cum modi, labore rem voluptates animi eum,
          commodi vel officiis similique sequi nulla! Inventore minus ducimus perspiciatis impedit dicta, ipsum facilis
          natus laudantium dignissimos voluptates, illum neque animi sequi aliquid dolorem blanditiis similique beatae
          temporibus quidem sit voluptatibus nam a. Illum animi accusamus, dignissimos, facere ea ad rerum dolores nobis
          beatae repellendus doloribus quasi, harum iusto eum voluptates earum nam. Ratione magni accusantium
          consequuntur reiciendis quaerat illum, culpa labore natus, quas amet id laborum quisquam omnis unde voluptas
          sequi, voluptatum perferendis officia! Sapiente temporibus minima magni fuga est suscipit aperiam nostrum odit
          nulla architecto, illo eius veritatis quisquam ut tempore distinctio ea nam laudantium perspiciatis
          exercitationem sunt sed commodi. Ad eveniet impedit nobis cupiditate nesciunt modi tempore maxime, ex error
          quo nisi, officia labore adipisci molestiae iure quos id, at deleniti ea corporis reprehenderit? Maiores
          libero dolor nam voluptate odio sunt id quia expedita aliquid adipisci impedit vero, sapiente enim delectus,
          reprehenderit, sit eligendi recusandae consectetur voluptatum? Inventore id aspernatur fugiat quas vitae
          maiores rem aliquam nisi consectetur quidem iste, minima illum esse autem deserunt fugit accusamus officiis ex
          numquam reiciendis libero, non ab. Eos earum fugiat, iste nam quidem odio at cum aut similique explicabo?
          Magni dolorum nobis consectetur sunt vero iure laboriosam, quos placeat voluptas sequi ad nihil in repellat,
          harum commodi labore nam ratione. Repellendus nemo doloribus, perferendis voluptatem error cum quibusdam quod
          possimus earum ab expedita adipisci libero quam harum eaque veritatis? Cupiditate dolore dolorem laboriosam,
          velit nihil commodi? Aut ea voluptatum perspiciatis sunt maiores autem? Iure architecto fuga blanditiis veniam
          assumenda, tempore perferendis porro dicta doloribus obcaecati neque, amet omnis nisi libero saepe quos
          pariatur non repellat. Excepturi numquam voluptatem totam. Expedita voluptatum culpa explicabo perspiciatis?
          Reprehenderit aliquid voluptatum odio quod nulla exercitationem dolores distinctio iste quasi nostrum quidem
          ipsum, magnam corporis similique consequuntur esse et perspiciatis veritatis, blanditiis reiciendis ex
          tempora. Voluptates maxime id ipsum ducimus inventore doloribus! Quos eaque praesentium modi itaque, amet
          fugiat dolore ab laboriosam sapiente perferendis maiores quia accusantium voluptatem sint cupiditate officia
          ad a incidunt nulla consequatur laborum! Harum nobis sunt pariatur. Neque, aliquam, ut necessitatibus nemo
          voluptas, ex aliquid magni fugit dolore sit modi nam vel voluptatibus eum iure! Magnam at fugiat id provident
          sequi iste a optio, labore voluptatum mollitia vitae maxime iusto alias commodi illum possimus itaque.
          Blanditiis in minus suscipit corporis! Nihil, culpa sed exercitationem fugit a numquam. Et rem dignissimos
          distinctio dolorum aperiam?
        </p>
      )}
    </section>
  );
}

export default function ScrollMobile() {
  useEffect(() => {
    // Prevent blocking scroll when page is reloaded
    if (!isIOS) {
      document.querySelector("html").style.overflowY = "scroll";
      document.querySelector("html").style.height = "100%";
    }
    // Prevent blocking scroll up on Safari
    if ((isSafari || isFirefox) && isDesktop) {
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
