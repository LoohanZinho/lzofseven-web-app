import { Badge } from '@/components/ui/badge';

type TagFilterProps = {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
};

export default function TagFilter({ tags, selectedTag, onSelectTag }: TagFilterProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="p-2 space-y-2">
      <h3 className="px-2 text-xs font-semibold text-muted-foreground">TAGS</h3>
      <div className="flex flex-wrap gap-2 px-2">
        <Badge
          variant={!selectedTag ? 'default' : 'secondary'}
          onClick={() => onSelectTag(null)}
          className="cursor-pointer"
        >
          Todas
        </Badge>
        {tags.map(tag => (
          <Badge
            key={tag}
            variant={selectedTag === tag ? 'default' : 'secondary'}
            onClick={() => onSelectTag(tag)}
            className="cursor-pointer"
          >
            #{tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
