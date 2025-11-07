import React, { useState } from "react";
import { Popover, Box, Tabs, Tab } from "@mui/material";
import "./EmojiPicker.css";

const emojiCategories = {
  "😀": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒"],
  "😢": ["😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "😷", "🤒", "🤕"],
  "👋": ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶"],
  "❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "🕎", "🔯", "♈", "♉", "♊", "♋", "♌", "♍"],
  "👍": ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐", "✋", "🖖", "👏", "🙌"],
  "🎉": ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥅", "🏒", "🏑", "🏏", "🥊", "🤿", "🎯", "🎮", "🕹️", "🎰", "🎲"],
  "🍕": ["🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🥞", "🧇", "🥨", "🥯", "🥐", "🍞", "🥖", "🧀", "🥗", "🥙", "🥪", "🌮", "🌯", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🍘", "🍙", "🍚", "🍠", "🍢"],
  "🚗": ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🚁", "🚟", "🚠", "🚡", "🛰️", "🚀", "🛸"],
};

const EmojiPicker = ({ anchorEl, open, onClose, onEmojiClick }) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const categories = Object.keys(emojiCategories);

  const handleEmojiClick = (emoji) => {
    onEmojiClick(emoji);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      PaperProps={{
        style: {
          width: '320px',
          maxHeight: '400px',
          padding: '8px',
        },
      }}
    >
      <Box>
        <Tabs
          value={selectedCategory}
          onChange={(e, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: '40px',
            borderBottom: '1px solid #e9edef',
            '& .MuiTab-root': {
              minWidth: '40px',
              padding: '8px',
            },
          }}
        >
          {categories.map((emoji, index) => (
            <Tab key={index} label={emoji} />
          ))}
        </Tabs>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '4px',
            padding: '8px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {emojiCategories[categories[selectedCategory]]?.map((emoji, index) => (
            <Box
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              sx={{
                fontSize: '24px',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: '#f0f2f5',
                },
              }}
            >
              {emoji}
            </Box>
          ))}
        </Box>
      </Box>
    </Popover>
  );
};

export default EmojiPicker;

