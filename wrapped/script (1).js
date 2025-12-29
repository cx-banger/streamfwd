// https://www.imranmanzoor.com

const panels = document.querySelectorAll(".panel1");
const secondaryPanels = document.querySelectorAll(".panel2");
const numberOfPanels = 12;
const rotationCoef = 5;
let elHeight = window.innerHeight / numberOfPanels;
let elWidth = window.innerWidth / numberOfPanels;
const textCallout = document.querySelector(".callout");
const textSub = document.querySelector(".subtitle");
const wrappedLogo = document.querySelector(".wrapped-logo");
const coverImage = document.querySelector(".cover-image");
const songTitle = document.querySelector(".song-title");
const coverImage2 = document.querySelector(".cover-image-2");
const songTitle2 = document.querySelector(".song-title-2");

var tl = gsap.timeline({ repeat: -1 });

window.addEventListener("resize", (event) => {
  elHeight = window.innerHeight / numberOfPanels;
  elWidth = window.innerWidth / numberOfPanels;
  tl.clear();
  addItemsToTimeline();
  tl.progress(0);
});

addItemsToTimeline();

//GSAP animations are thrown inside here just to make it easier to call them again on resize
function addItemsToTimeline() {
  //text animation - Logo et Wrapped ensemble
  tl.fromTo(
    [wrappedLogo, textCallout],
    {
      left: "150%"
    },
    {
      left: "50%",
      ease: "expo.out",
      duration: 1,
      delay: 1.2
    },
    0
  );

  tl.to(
    [wrappedLogo, textCallout],
    {
      y: "-60px",
      delay: 3,
      duration: 0.5,
      ease: "sine.out"
    },
    0
  );

  tl.fromTo(
    textSub,
    {
      opacity: 0,
      y: 50
    },
    {
      opacity: 1,
      y: 0,
      ease: "sine.out",
      duration: 0.5,
      delay: 3
    },
    0
  );

  //text exit - Logo et textes sortent ensemble
  tl.to(
    [wrappedLogo, textCallout, textSub],
    {
      left: "-150%",
      ease: "sine.in",
      duration: 1,
      delay: 1.2
    },
    4
  );

  // ===== ANIMATION DE L'IMAGE COVER ET DU TITRE =====
  if (coverImage && songTitle) {
    // Apparition du cover et du titre ensemble
    tl.fromTo(
      [coverImage, songTitle],
      {
        opacity: 0,
        scale: 0.5,
        rotation: -180
      },
      {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1,
        ease: "back.out(1.7)"
      },
      5.5 // Timing d'apparition
    );

    // Légère rotation pendant qu'ils sont visibles
    tl.to(
      [coverImage, songTitle],
      {
        rotation: 3,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 2
      },
      ">"
    );

    // Disparition du cover et du titre ensemble
    tl.to(
      [coverImage, songTitle],
      {
        opacity: 0,
        scale: 1.5,
        rotation: 180,
        duration: 1,
        ease: "power2.in"
      },
      "+=2"
    );
  }
  // ===== FIN ANIMATION IMAGE ET TITRE =====

  panels.forEach((panel, i) => {
    const stopPosition = 100 - i * 1;
    const wi = window.innerWidth - elWidth * (12 - i) + elWidth;
    const he = window.innerHeight - elHeight * (12 - i) + elHeight;
    const wi8 = window.innerWidth - elWidth * (8 - i) + elWidth;
    
    // initial rotation
    tl.fromTo(
      panel,
      {
        y: elHeight * 5.5,
        x: elWidth * 5.5,
        width: 0,
        height: 0,
        rotation: -360,
        background: `linear-gradient(105deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) ${stopPosition}%)`
      },
      {
        width: wi,
        height: he,
        y: -elHeight / 1.33 + ((12 - i) * elHeight) / 1.33,
        x: 0,
        duration: 1 + 0.1 * (12 - i),
        ease: "sine.inOut",
        rotation: 0,
        background: `linear-gradient(105deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) ${stopPosition}%)`
      },
      0
    );

    // linear rotation
    tl.to(
      panel,
      {
        rotation: 12 * rotationCoef - (i + 1) * rotationCoef,
        duration: 3,
        background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) ${stopPosition}%)`,
        ease: "linear"
      },
      ">"
    );

    //reordering
    tl.to(
      panel,
      {
        rotation: 360,
        y: -elHeight / 6 + ((12 - i) * elHeight) / 6,
        x: -elWidth / 1.2 + ((12 - i) * elWidth) / 1.2,
        background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
        ease: "sine.inOut",
        duration: 1
      },
      ">"
    );

    //linear rotation
    tl.to(
      panel,
      {
        rotation: 12 * rotationCoef - (i + 1) * rotationCoef + 360,
        duration: 4,
        background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
        ease: "linear"
      },
      ">"
    );

    if (i == 0) {
      tl.addLabel("splitStart", "-=0.8");
    }

    secondaryPanels.forEach((twoPanel, index) => {
      const wi2 = window.innerWidth - elWidth * index + elWidth;
      const he2 = window.innerHeight - elHeight * index + elHeight;
      tl.fromTo(
        twoPanel,
        {
          y: elHeight * 5.5,
          x: elWidth * 5.5,
          width: 0,
          height: 0,
          rotation: -360,
          background: `linear-gradient(105deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`
        },
        {
          rotation: -90,
          y: 0 + (index * elHeight) / 4 - wi2,
          x: -elWidth / 2 + (index * elWidth) / 2,
          width: wi2,
          height: wi2,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "sine.inOut",
          duration: 1
        },
        "splitStart" + "+=" + String(0.05 * index)
      );

      tl.to(
        twoPanel,
        {
          rotation: 12 * rotationCoef - (12 - index) * rotationCoef - 90,
          duration: 5,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "linear"
        },
        ">"
      );
      
       tl.to(
        twoPanel,
        {
          rotation: 300,
          y: 0 + (index * elHeight) /2 - wi2,
          x: (window.innerWidth*1.1 - wi2 * 1.2 ),
          width: wi2,
          height: wi2,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "sine.inOut",
          duration: 1
        },
        ">"
      );
      
            tl.to(
        twoPanel,
        {
          rotation: "+=15",
          duration: 5,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "linear"
        },
        ">"
      );
      
             tl.to(
        twoPanel,
        {
          rotation: "+=360",
          y: "-=" + String(wi2*2),
          x: "+=" + String(wi2*2),
          width: wi2,
          height: wi2,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "sine.inOut",
          duration: 1
        },
        ">"
      );
    });

    if (i == 0) {
      tl.to(
        panel,
        {
          rotation: 720 + 90,
          y: window.innerHeight - ((12 - i) * elHeight) / 4,
          x: -elWidth / 2 + ((12 - i) * elWidth) / 2,
          width: 0,
          height: 0,
          opacity: 0,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "sine.inOut",
          duration: 1
        },
        "splitStart" + "+=" + String(0.05 * i)
      );
    } else {
      tl.to(
        panel,
        {
          rotation: 720 + 90,
          y: window.innerHeight - ((12 - i) * elHeight) / 4,
          x: -elWidth / 2 + ((12 - i) * elWidth) / 2,
          width: wi,
          height: wi,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "sine.inOut",
          duration: 1
        },
        "splitStart" + "+=" + String(0.05 * i)
      );

      tl.to(
        panel,
        {
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 810,
          duration: 5,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "linear"
        },
        ">"
      );

      tl.to(
        panel,
        {
          y: window.innerHeight - ((12 - i) * elHeight) / 2,
          x: 0 - elWidth * 1.2,
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 1180,
          ease: "sine.inOut",
          duration: 1,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "sine.inOut"
        },
        ">"
      );

      tl.to(
        panel,
        {
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 1200,
          duration: 5,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "linear"
        },
        ">"
      );

      tl.to(
        panel,
        {
          y: "+=" + String(elHeight*4),
          x: "-=" + String(elWidth*4),
          rotation: (12 * rotationCoef - (i + 1) * rotationCoef) / 1.2 + 1500,
          ease: "sine.inOut",
          duration: 1,
          background: `linear-gradient(90deg,rgba(76, 175, 80, 1) 0%,rgba(56, 142, 60, 1) 6%,rgba(27, 94, 32, 1) 19%,rgba(13, 47, 16, 1) 72%,rgba(0, 0, 0, 1) 100%)`,
          ease: "sine.inOut"
        },
        ">"
      );
    }
  });

  // ===== ANIMATION DU DEUXIÈME COVER ET TITRE =====
  if (coverImage2 && songTitle2) {
    // Apparition du deuxième cover - ajustez le timing pour synchroniser
    tl.fromTo(
      [coverImage2, songTitle2],
      {
        opacity: 0,
        scale: 0.5,
        rotation: -180
      },
      {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1,
        ease: "back.out(1.7)"
      },
      15.5 // AJUSTEZ CE NOMBRE : essayez 13, 14, 15, 16 jusqu'à ce que ça colle parfaitement
    );

    // Légère rotation pendant qu'ils sont visibles
    tl.to(
      [coverImage2, songTitle2],
      {
        rotation: 3,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 2
      },
      ">"
    );

    // Disparition du deuxième cover
    tl.to(
      [coverImage2, songTitle2],
      {
        opacity: 0,
        scale: 1.5,
        rotation: 180,
        duration: 1,
        ease: "power2.in"
      },
      "+=0"
    );
  }
  // ===== FIN ANIMATION DEUXIÈME COVER =====
} // ← dernière accolade de addItemsToTimeline()

/* ===========================
   MUSIQUE DE FOND
   =========================== */

const audio = document.getElementById("bgMusic");

const startTime = 10;
const endTime = 39;

// Sécurité si l'audio existe bien
if (audio) {
  audio.currentTime = startTime;

  audio.addEventListener("timeupdate", () => {
    if (audio.currentTime >= endTime) {
      audio.currentTime = startTime;
      audio.play();
    }
  });

  // Active le son au premier geste utilisateur
  function enableSound() {
    audio.muted = false;
    audio.play();
    document.removeEventListener("click", enableSound);
    document.removeEventListener("touchstart", enableSound);
  }

  document.addEventListener("click", enableSound);
  document.addEventListener("touchstart", enableSound);
}
