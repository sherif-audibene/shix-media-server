"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import FolderIcon from "@mui/icons-material/Folder";
import { CardClickArea, Thumb } from "@/components/VideoCard/VideoCard.styled";

export interface FolderCardProps {
  name: string;
  /** Already-formatted caption, e.g. "12 videos". */
  caption: string;
  onOpen: () => void;
}

/** A folder tile matching the video grid — click to drill into the folder. */
export function FolderCard({ name, caption, onOpen }: FolderCardProps) {
  return (
    <Card variant="outlined">
      <CardClickArea
        role="button"
        tabIndex={0}
        aria-label={name}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <Thumb sx={{ backgroundColor: "action.hover" }}>
          <FolderIcon sx={{ fontSize: 72, color: "primary.main" }} />
        </Thumb>
        <CardContent>
          <Typography variant="subtitle2" noWrap title={name}>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        </CardContent>
      </CardClickArea>
    </Card>
  );
}
