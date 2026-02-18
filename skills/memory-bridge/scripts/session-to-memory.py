#!/usr/bin/env python3
"""
Session to Memory Bridge

Reads OpenClaw session JSONL files and extracts key information
into organized memory files for cross-session continuity.

Usage:
    python3 session-to-memory.py --agent-id <agent-id> [options]

Options:
    --agent-id          Required. Agent ID to process
    --since DATE        Start date (YYYY-MM-DD)
    --until DATE        End date (YYYY-MM-DD)
    --dry-run           Preview without writing
    --daily-summary     Generate consolidated daily summaries
    --update-memory-md  Force MEMORY.md update
    --max-sessions N    Limit to N most recent sessions
"""

import argparse
import json
import os
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple


# Extraction patterns for different categories
DECISION_PATTERNS = [
    r"(?i)(?:decided?|agreed?|concluded?|chosen?|chose)\s+(?:to\s+)?(.+)",
    r"(?i)(?:let['']s|we['']ll|going to)\s+(.+?)(?:\.|$)",
    r"(?i)(?:plan is|strategy is)\s+(?:to\s+)?(.+)",
]

FACT_PATTERNS = [
    r"(?i)(?:learned?|discovered?|found out|realized?)\s+(?:that\s+)?(.+)",
    r"(?i)(?:interesting(?:ly)?|notably|importantly)\s+(?:to note)?[,:\s]+(.+)",
    r"(?i)(?:fact is|the truth is)\s+(?:that\s+)?(.+)",
]

PREFERENCE_PATTERNS = [
    r"(?i)(?:prefer(?:s|red)?|like(?:s|d)?|want(?:s|ed)?)\s+(?:to\s+)?(.+)",
    r"(?i)(?:favorite|preferred)\s+(?:is|are)\s+(.+)",
    r"(?i)(?:rather|instead)\s+(?:of\s+)?(.+?)(?:,|\s+prefer)",
]

TODO_PATTERNS = [
    r"(?i)(?:todo|to-do|action item|follow.?up)[:\s]+(.+)",
    r"(?i)(?:remember to|don['']t forget to|make sure to)\s+(.+)",
    r"(?i)(?:need(?:s|ed)?|should|must|have to)\s+(?:to\s+)?(.+)",
]

ERROR_PATTERNS = [
    r"(?i)(?:error|mistake|issue|problem|bug|failed?)[,:]?\s+(.+)",
    r"(?i)(?:lesson learned?)[:\s]+(.+)",
    r"(?i)(?:watch out for|be careful of|avoid)\s+(.+)",
]


class MemoryExtractor:
    """Extracts and organizes memory from session files."""

    def __init__(self, agent_id: str, workspace_path: str = None):
        self.agent_id = agent_id
        self.workspace_path = Path(workspace_path or os.path.expanduser("~/.openclaw/workspace"))
        self.sessions_path = Path(os.path.expanduser(f"~/.openclaw/agents/{agent_id}/sessions"))
        self.memory_path = self.workspace_path / "memory"
        self.memory_md_path = self.workspace_path / "MEMORY.md"
        
        # Ensure memory directory exists
        self.memory_path.mkdir(parents=True, exist_ok=True)

    def get_session_files(self, since: Optional[datetime] = None, 
                         until: Optional[datetime] = None,
                         max_sessions: Optional[int] = None) -> List[Path]:
        """Get list of session files matching criteria."""
        if not self.sessions_path.exists():
            print(f"[WARNING] Sessions path not found: {self.sessions_path}")
            return []

        sessions = []
        for session_file in sorted(self.sessions_path.glob("*.jsonl"), reverse=True):
            # Parse date from filename (format: <agent>-<timestamp>.jsonl)
            try:
                # Extract timestamp from filename
                filename = session_file.stem
                # Try to parse various timestamp formats
                timestamp = self._parse_session_timestamp(filename)
                
                if since and timestamp < since:
                    continue
                if until and timestamp > until:
                    continue
                    
                sessions.append((timestamp, session_file))
            except (ValueError, IndexError):
                # If we can't parse the timestamp, include it anyway
                sessions.append((datetime.now(), session_file))

        # Sort by timestamp, newest first
        sessions.sort(key=lambda x: x[0], reverse=True)
        
        if max_sessions:
            sessions = sessions[:max_sessions]
            
        return [s[1] for s in sessions]

    def _parse_session_timestamp(self, filename: str) -> datetime:
        """Parse timestamp from session filename."""
        # Common formats:
        # agent-20260203-143022.jsonl
        # agent-2026-02-03-14-30-22.jsonl
        # agent-20260203143022.jsonl
        
        patterns = [
            r"(\d{8})-(\d{6})",  # 20260203-143022
            r"(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})",  # 2026-02-03-14-30-22
            r"(\d{14})",  # 20260203143022
            r"(\d{8})-(\d{2})(\d{2})(\d{2})",  # 20260203-143022
        ]
        
        for pattern in patterns:
            match = re.search(pattern, filename)
            if match:
                groups = match.groups()
                if len(groups) == 2:  # date-time format
                    date_str, time_str = groups
                    return datetime.strptime(f"{date_str}{time_str}", "%Y%m%d%H%M%S")
                elif len(groups) == 6:  # full format
                    return datetime(*map(int, groups))
                elif len(groups) == 1:  # compact format
                    return datetime.strptime(groups[0], "%Y%m%d%H%M%S")
                elif len(groups) == 4:  # date-hhmmss
                    date_str = groups[0]
                    time_str = "".join(groups[1:])
                    return datetime.strptime(f"{date_str}{time_str}", "%Y%m%d%H%M%S")
        
        # If no pattern matches, return current time
        return datetime.now()

    def parse_session(self, session_file: Path) -> Dict:
        """Parse a session JSONL file into structured data."""
        entries = []
        session_start = None
        session_end = None
        
        try:
            with open(session_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        entries.append(entry)
                        
                        # Track session time range
                        timestamp = entry.get('timestamp') or entry.get('created_at')
                        if timestamp:
                            try:
                                ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                                if not session_start or ts < session_start:
                                    session_start = ts
                                if not session_end or ts > session_end:
                                    session_end = ts
                            except:
                                pass
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            print(f"[ERROR] Failed to parse {session_file}: {e}")
            return {}

        return {
            'file': session_file,
            'entries': entries,
            'start': session_start,
            'end': session_end,
            'duration': (session_end - session_start) if session_start and session_end else None
        }

    def _is_documentation(self, text: str) -> bool:
        """Check if text is documentation rather than conversation."""
        doc_markers = [
            'SKILL.md', '## ', '# ', '```', '---', '[TODO:', 'Example:',
            'Workflow', 'Pattern', 'Reference', 'Guide', 'Documentation',
            'bundled resources', 'progressive disclosure', 'core principles',
            'file layout', '## Overview', '## Quick', '## Usage',
            '### ', '#### ', '| ', '- **', '1. ', '2. ', '3. '
        ]
        # If text has many markdown/code markers, it's probably docs
        marker_count = sum(1 for m in doc_markers if m in text[:1000])
        if marker_count >= 3:
            return True
        # If it's very long with lots of formatting, likely docs
        if len(text) > 2000 and text.count('`') > 20:
            return True
        return False
    
    def _extract_text_from_entry(self, entry: Dict) -> Optional[str]:
        """Extract conversation text from a session entry, filtering out docs."""
        msg = entry.get('message')
        if not isinstance(msg, dict):
            return None
        
        role = msg.get('role')
        # Only extract from user and assistant messages
        if role not in ('user', 'assistant'):
            return None
        
        content = msg.get('content')
        if not content:
            return None
        
        text_parts = []
        if isinstance(content, list):
            for c in content:
                if isinstance(c, dict):
                    # Skip tool calls and tool results
                    if c.get('type') in ('toolCall', 'toolResult'):
                        continue
                    if c.get('type') == 'text':
                        text_parts.append(c.get('text', ''))
        elif isinstance(content, str):
            text_parts.append(content)
        
        text = ' '.join(text_parts).strip()
        if not text or len(text) < 20:
            return None
        
        # Skip if it looks like documentation
        if self._is_documentation(text):
            return None
        
        return text

    def extract_content(self, session_data: Dict) -> Dict[str, List[str]]:
        """Extract categorized content from session entries."""
        extracted = {
            'decisions': [],
            'facts': [],
            'preferences': [],
            'todos': [],
            'errors': [],
            'topics': []
        }
        
        conversation_texts = []
        for entry in session_data.get('entries', []):
            text = self._extract_text_from_entry(entry)
            if text:
                conversation_texts.append(text)
                
                # Check each pattern category
                for pattern in DECISION_PATTERNS:
                    matches = re.findall(pattern, text)
                    extracted['decisions'].extend(matches)
                
                for pattern in FACT_PATTERNS:
                    matches = re.findall(pattern, text)
                    extracted['facts'].extend(matches)
                
                for pattern in PREFERENCE_PATTERNS:
                    matches = re.findall(pattern, text)
                    extracted['preferences'].extend(matches)
                
                for pattern in TODO_PATTERNS:
                    matches = re.findall(pattern, text)
                    extracted['todos'].extend(matches)
                
                for pattern in ERROR_PATTERNS:
                    matches = re.findall(pattern, text)
                    extracted['errors'].extend(matches)
        
        # Simple topic extraction (look for keywords)
        text_combined = " ".join(conversation_texts).lower()
        topic_keywords = [
            'project', 'setup', 'config', 'api', 'database', 'ui', 'frontend',
            'backend', 'deploy', 'test', 'debug', 'fix', 'create', 'update',
            'meeting', 'call', 'email', 'schedule', 'reminder'
        ]
        for keyword in topic_keywords:
            if keyword in text_combined:
                extracted['topics'].append(keyword)
        extracted['topics'] = list(set(extracted['topics']))[:5]  # Max 5 unique topics
        
        return extracted

    def format_entry(self, category: str, content: str) -> str:
        """Format a single entry for writing to memory file."""
        # Clean up the content
        content = content.strip()
        if content.endswith('.') or content.endswith('!'):
            content = content[:-1]
        # Capitalize first letter
        content = content[0].upper() + content[1:] if content else content
        return f"- {content}\n"

    def write_daily_memory(self, date: datetime, session_id: str, 
                          extracted: Dict, duration: Optional[timedelta] = None,
                          dry_run: bool = False) -> str:
        """Write extracted content to daily memory file."""
        date_str = date.strftime("%Y-%m-%d")
        memory_file = self.memory_path / f"{date_str}.md"
        
        # Build the content
        lines = []
        
        # Check if file exists to avoid duplicate headers
        if not memory_file.exists():
            lines.append(f"# Memory Log - {date_str}\n\n")
        
        lines.append(f"## Session: {session_id}\n")
        
        if duration:
            minutes = int(duration.total_seconds() / 60)
            lines.append(f"**Duration**: {minutes} minutes\n")
        
        if extracted.get('topics'):
            lines.append(f"**Topics**: {', '.join(extracted['topics'])}\n")
        
        lines.append("\n")
        
        # Add categorized content
        has_content = False
        for category, items in extracted.items():
            if category == 'topics' or not items:
                continue
            
            has_content = True
            category_title = category.replace('_', ' ').title()
            lines.append(f"### {category_title}\n")
            for item in items[:10]:  # Limit to 10 per category
                lines.append(self.format_entry(category, item))
            lines.append("\n")
        
        if not has_content:
            lines.append("*No significant items extracted*\n\n")
        
        content = "".join(lines)
        
        if dry_run:
            print(f"\n[DRY RUN] Would append to {memory_file}:")
            print(content)
            return content
        
        # Append to file
        with open(memory_file, 'a', encoding='utf-8') as f:
            f.write(content)
        
        print(f"[OK] Appended to {memory_file}")
        return content

    def update_memory_md(self, important_items: List[Tuple[str, str]], 
                         dry_run: bool = False) -> bool:
        """Update MEMORY.md with important long-term context."""
        if not important_items:
            return False
        
        memory_md_content = []
        
        # Read existing content if file exists
        if self.memory_md_path.exists():
            with open(self.memory_md_path, 'r', encoding='utf-8') as f:
                memory_md_content = f.readlines()
        else:
            # Create header for new file
            memory_md_content = ["# Agent Memory\n\n"]
        
        # Build new entries
        new_entries = []
        today = datetime.now().strftime("%Y-%m-%d")
        
        for category, item in important_items:
            if category == 'decisions':
                new_entries.append(f"- [{today}] {item}\n")
            elif category == 'preferences':
                new_entries.append(f"- **Preference**: {item}\n")
            elif category == 'facts' and 'important' in item.lower():
                new_entries.append(f"- [{today}] {item}\n")
        
        if not new_entries:
            return False
        
        # Find appropriate sections or append to end
        if dry_run:
            print(f"\n[DRY RUN] Would update {self.memory_md_path}:")
            for entry in new_entries:
                print(f"  {entry.strip()}")
            return True
        
        # Append to file (in a real implementation, you'd be smarter about section placement)
        with open(self.memory_md_path, 'a', encoding='utf-8') as f:
            f.write(f"\n## Updates - {today}\n\n")
            for entry in new_entries:
                f.write(entry)
        
        print(f"[OK] Updated {self.memory_md_path}")
        return True

    def process_sessions(self, since: Optional[datetime] = None,
                        until: Optional[datetime] = None,
                        max_sessions: Optional[int] = None,
                        dry_run: bool = False,
                        update_memory: bool = False) -> Dict:
        """Process sessions and generate memory files."""
        session_files = self.get_session_files(since, until, max_sessions)
        
        if not session_files:
            print("[INFO] No session files found matching criteria")
            return {'processed': 0, 'extracted': 0}
        
        print(f"[INFO] Found {len(session_files)} session files to process")
        
        processed = 0
        total_extracted = 0
        important_items = []
        
        for session_file in session_files:
            print(f"\n[PROCESSING] {session_file.name}")
            
            session_data = self.parse_session(session_file)
            if not session_data or not session_data.get('entries'):
                print("  [SKIP] Empty or invalid session")
                continue
            
            extracted = self.extract_content(session_data)
            
            # Count extracted items
            item_count = sum(len(v) for k, v in extracted.items() if k != 'topics')
            total_extracted += item_count
            print(f"  [EXTRACTED] {item_count} items")
            
            # Determine session date
            session_date = session_data.get('start') or datetime.now()
            session_id = session_file.stem
            
            # Write to daily memory
            self.write_daily_memory(
                session_date, 
                session_id, 
                extracted,
                session_data.get('duration'),
                dry_run
            )
            
            # Collect important items for MEMORY.md
            if update_memory:
                for category, items in extracted.items():
                    if category in ['decisions', 'preferences']:
                        for item in items[:3]:  # Top 3 from each category
                            important_items.append((category, item))
            
            processed += 1
        
        # Update MEMORY.md if requested
        if update_memory and important_items:
            self.update_memory_md(important_items, dry_run)
        
        return {
            'processed': processed,
            'extracted': total_extracted,
            'sessions': [s.name for s in session_files]
        }


def main():
    parser = argparse.ArgumentParser(
        description="Extract memories from OpenClaw sessions"
    )
    parser.add_argument(
        "--agent-id",
        required=True,
        help="Agent ID to process sessions for"
    )
    parser.add_argument(
        "--since",
        help="Process sessions from this date (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--until",
        help="Process sessions until this date (YYYY-MM-DD)"
    )
    parser.add_argument(
        "--max-sessions",
        type=int,
        help="Limit to N most recent sessions"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview without writing files"
    )
    parser.add_argument(
        "--update-memory-md",
        action="store_true",
        help="Update MEMORY.md with important items"
    )
    parser.add_argument(
        "--workspace",
        default=os.path.expanduser("~/.openclaw/workspace"),
        help="Path to workspace directory"
    )
    
    args = parser.parse_args()
    
    # Parse dates
    since = datetime.strptime(args.since, "%Y-%m-%d") if args.since else None
    until = datetime.strptime(args.until, "%Y-%m-%d") if args.until else None
    
    if until:
        until = until + timedelta(days=1)  # Include the full day
    
    # Default to last 24 hours if no dates specified
    if not since and not until:
        since = datetime.now() - timedelta(days=1)
    
    # Initialize extractor
    extractor = MemoryExtractor(args.agent_id, args.workspace)
    
    print(f"Memory Bridge - Processing sessions for agent: {args.agent_id}")
    print(f"  Workspace: {args.workspace}")
    if since:
        print(f"  Since: {since.strftime('%Y-%m-%d')}")
    if until:
        print(f"  Until: {(until - timedelta(days=1)).strftime('%Y-%m-%d')}")
    if args.dry_run:
        print("  Mode: DRY RUN (no files will be written)")
    print()
    
    # Process sessions
    results = extractor.process_sessions(
        since=since,
        until=until,
        max_sessions=args.max_sessions,
        dry_run=args.dry_run,
        update_memory=args.update_memory_md
    )
    
    print(f"\n{'='*50}")
    print(f"Summary: Processed {results['processed']} sessions")
    print(f"         Extracted {results['extracted']} items")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
