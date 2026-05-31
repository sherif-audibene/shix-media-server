import type { Meta, StoryObj } from "@storybook/nextjs";
import { VideoGrid } from "@/components/VideoGrid/VideoGrid";
import type { VideoFile } from "@/schemas/video";

const sample = (name: string, relPath: string, size: number): VideoFile => ({
  id: Buffer.from(relPath).toString("base64url"),
  name,
  relPath,
  ext: ".mp4",
  mimeType: "video/mp4",
  size,
  modifiedAt: new Date("2024-06-01"),
});

const videos: VideoFile[] = [
  sample("Holiday clip.mp4", "Holiday clip.mp4", 1024 * 1024 * 42),
  sample("Conference talk.mp4", "talks/Conference talk.mp4", 1024 * 1024 * 310),
  sample("Drone footage.mp4", "outdoor/Drone footage.mp4", 1024 * 1024 * 980),
];

const meta = {
  title: "Components/VideoGrid",
  component: VideoGrid,
  parameters: { layout: "padded" },
  args: { folderId: "movies", videos },
} satisfies Meta<typeof VideoGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { videos: [] },
};
