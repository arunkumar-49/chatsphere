const EMOJIS = ['😀','😂','😍','🥰','😎','🤔','😅','🥳','👍','👎','❤️','🔥','✅','🎉','💯','⭐','😭','😤','🤯','🥺','😴','🤗','😏','🫡','👋','🙌','🤝','💪','🫶','👀','🎯','🚀','💬','💡','⚡','🌟','🏆','🎊','🎁','🍕'];

export default function EmojiPicker({ onSelect }) {
  return (
    <div className="emoji-picker-container">
      <div className="emoji-grid">
        {EMOJIS.map((emoji) => (
          <button key={emoji} className="emoji-btn" onClick={() => onSelect(emoji)} title={emoji}>{emoji}</button>
        ))}
      </div>
    </div>
  );
}
