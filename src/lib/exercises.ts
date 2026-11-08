import type { ExerciseId } from "./plan-30";
export type Exercise = {
  name: string;
  muscles: string;
  equipment: string;
  steps: string[];
  avoid: string;
  source: string;
  sourceName: string;
};
export const EXERCISES: Record<ExerciseId, Exercise> = {
  pushup: {
    name: "Pompki",
    muscles: "Klatka · triceps · barki",
    equipment: "Mata / stabilne podwyższenie",
    steps: [
      "Dłonie nieco szerzej niż barki. Utrzymuj tułów w jednej linii i napnij brzuch.",
      "Zegnij łokcie, kierując je ukośnie do tyłu. Opuść klatkę w kontrolowanym ruchu.",
      "Odepchnij podłoże i wróć do pozycji początkowej bez opadania bioder.",
    ],
    avoid:
      "Nie unoś samych barków ani nie zapadaj lędźwi. Jeśli trudno utrzymać pozycję, oprzyj dłonie na stabilnym podwyższeniu.",
    source: "https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/",
    sourceName: "ACE: Push-up",
  },
  "lateral-raise": {
    name: "Unoszenie hantli bokiem",
    muscles: "Barki",
    equipment: "Dwa lekkie hantle",
    steps: [
      "Stań stabilnie, hantle trzymaj po bokach, łokcie lekko ugięte.",
      "Unieś ramiona bokiem do wysokości barków, zachowując kąt w łokciach.",
      "Opuść powoli do boków. Unoszenie obu hantli i powrót to jedno powtórzenie.",
    ],
    avoid: "Nie kołysz tułowiem i nie wzruszaj barkami. Nie unoś ciężaru ponad linię barków.",
    source: "https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/",
    sourceName: "ACE: Lateral Raise",
  },
  "hammer-curl": {
    name: "Uginanie młotkowe",
    muscles: "Biceps · ramiona · przedramiona",
    equipment: "Dwa hantle",
    steps: [
      "Trzymaj hantle przy biodrach, kciuki skierowane do przodu. Łokcie blisko tułowia.",
      "Zegnij łokcie i unieś hantle w kierunku barków bez przesuwania ramion.",
      "Powoli opuść hantle. Ruch obiema rękami i powrót liczy się jako jedno powtórzenie.",
    ],
    avoid: "Nie odchylaj pleców i nie rozpędzaj hantli biodrami. Zachowaj neutralne nadgarstki.",
    source: "https://www.catalystathletics.com/exercise/841/Hammer-Curl/",
    sourceName: "Catalyst Athletics: Hammer Curl",
  },
  "triceps-extension": {
    name: "Prostowanie ramion nad głową",
    muscles: "Triceps · tył ramion",
    equipment: "Jeden hantel trzymany oburącz",
    steps: [
      "Chwyć pewnie jeden hantel oburącz i unieś nad głowę. Napnij brzuch, ramiona trzymaj blisko uszu.",
      "Zegnij łokcie, opuszczając hantel za głowę w wygodnym zakresie. Ramiona pozostają nieruchome.",
      "Wyprostuj łokcie i wróć nad głowę. Opuszczenie i uniesienie to jedno powtórzenie.",
    ],
    avoid:
      "Nie wyginaj lędźwi i nie rozchylaj łokci na boki. Użyj lekkiego hantla, który możesz pewnie utrzymać.",
    source: "https://www.acefitness.org/resources/everyone/exercise-library/74/triceps-extension/",
    sourceName: "ACE: Triceps Extension",
  },
};
