import fs from "fs";
import path from "path";
import { Speaker, Lecture } from "@/types";
import { CatalogueClient } from "@/components/CatalogueClient";

export default function HomePage() {
  const speakersIndexPath = path.join(process.cwd(), "data", "speakers_index.json");
  const defaultSpeakerPath = path.join(process.cwd(), "data", "speakers", "amarendra-das.json");

  let speakers: Speaker[] = [];
  let initialLectures: Lecture[] = [];

  try {
    if (fs.existsSync(speakersIndexPath)) {
      speakers = JSON.parse(fs.readFileSync(speakersIndexPath, "utf-8"));
    }
    if (fs.existsSync(defaultSpeakerPath)) {
      initialLectures = JSON.parse(fs.readFileSync(defaultSpeakerPath, "utf-8"));
    }
  } catch (err) {
    console.error("Error reading initial catalog data:", err);
  }

  return (
    <CatalogueClient
      initialSpeakers={speakers}
      initialLectures={initialLectures}
      initialSpeakerSlug="amarendra-das"
    />
  );
}
