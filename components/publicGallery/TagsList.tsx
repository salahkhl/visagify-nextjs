"use client";

import React from "react";
import { Tag } from "@/lib/mockData";
import TagCard from "./TagCard";

type TagsListProps = {
  tags: Tag[];
};

const TagsList: React.FC<TagsListProps> = ({ tags }) => {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-[10px]">
      {tags.map((tag) => (
        <TagCard key={tag.slug} tag={tag} />
      ))}
    </div>
  );
};

export default TagsList;
