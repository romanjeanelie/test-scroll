import React, { useEffect, useRef } from "react";
import styles from "./ScrollMobile.module.scss";
import { isIOS } from "react-device-detect";
import useScrollDirection from "../hooks/useScrollDirection";

function Header() {
  const direction = useScrollDirection();

  // Refs
  const header = useRef();

  useEffect(() => {
    if (direction === "up") {
      header.current.classList.add(styles.expand);
      console.log("expand");
    } else {
      header.current.classList.remove(styles.expand);
      console.log("redu");
    }
  }, [direction]);
  return (
    <header ref={header} className={styles.header}>
      Header
    </header>
  );
}
function Section({ index }) {
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
      {/* <p>Header</p> */}
      <Header />
      {sections.map((el, i) => (
        <Section key={i} index={i} />
      ))}
      {/* <p>Footer</p> */}
    </>
  );
}
