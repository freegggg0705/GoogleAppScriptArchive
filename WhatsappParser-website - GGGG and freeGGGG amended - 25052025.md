//WhatsappParser-website - GGGG and freeGGGG amended - 25052025.md : Add grid view and collapse text thread with text font and text thread height and width adjustment.
https://grok.com/share/c2hhcmQtMg%3D%3D_3ac67505-4868-4537-926c-a4572326c79b
```

Step-by-Step Guide and Amended Code
1. Update src/stores/global.ts
We need to add atoms for:

showOriginalImageSizeAtom: Toggle for original image sizes.
uniformTextSizeAtom: Toggle for uniform text thread sizes.
textThreadWidthAtom, textThreadHeightAtom, textThreadFontSizeAtom: Adjustable text thread dimensions and font size.
gridViewAtom: Toggle for grid view.
gridColumnsAtom, gridRowsAtom: Adjustable grid dimensions.
Amended Code:

typescript

複製
// src/stores/global.ts
import { atom } from 'jotai';
import {
  extractFile,
  extractStartEndDatesFromMessages,
  messagesFromFile,
  participantsFromMessages,
} from '../utils/utils';

const isMenuOpenAtom = atom(false);
const activeUserAtom = atom('');
const isAnonymousAtom = atom(false);
const rawFileAtom = atom<FileReader['result']>(null);
const extractedFileAtom = atom(get => extractFile(get(rawFileAtom)));
const messagesAtom = atom(get =>
  messagesFromFile(get(extractedFileAtom), get(isAnonymousAtom)),
);
const participantsAtom = atom(get =>
  participantsFromMessages(get(messagesAtom)),
);
const messagesDateBoundsAtom = atom(get =>
  extractStartEndDatesFromMessages(get(messagesAtom)),
);
const showImagesAtom = atom(true);
const showContentAtom = atom(true);
const showDateAtom = atom(true);
const showAuthorAtom = atom(true);
const showOriginalImageSizeAtom = atom(false); // New: Toggle for original image sizes
const uniformTextSizeAtom = atom(false); // New: Toggle for uniform text thread sizes
const textThreadWidthAtom = atom(400); // New: Default width 400px
const textThreadHeightAtom = atom(200); // New: Default height 200px
const textThreadFontSizeAtom = atom(16); // New: Default font size 16px
const gridViewAtom = atom(false); // New: Toggle for grid view
const gridColumnsAtom = atom(3); // New: Default 3 columns
const gridRowsAtom = atom(3); // New: Default 3 rows

export {
  isMenuOpenAtom,
  activeUserAtom,
  isAnonymousAtom,
  rawFileAtom,
  messagesAtom,
  participantsAtom,
  extractedFileAtom,
  messagesDateBoundsAtom,
  showImagesAtom,
  showContentAtom,
  showDateAtom,
  showAuthorAtom,
  showOriginalImageSizeAtom,
  uniformTextSizeAtom,
  textThreadWidthAtom,
  textThreadHeightAtom,
  textThreadFontSizeAtom,
  gridViewAtom,
  gridColumnsAtom,
  gridRowsAtom,
};
Steps:

Open src/stores/global.ts.
Replace the existing code with the above, which adds the new atoms while preserving existing functionality.
Save the file.
2. Update src/components/Sidebar/Sidebar.tsx
Add controls for:

Toggle for original image sizes.
Toggle for uniform text thread sizes.
Buttons to adjust text thread width, height, and font size (up/down, supporting 400 increments).
Toggle for grid view.
Buttons to adjust grid columns and rows (1 to 10).
Amended Code:

typescript

複製
// src/components/Sidebar/Sidebar.tsx
import { useRef, useEffect, useState, startTransition } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import Credits from '../Credits/Credits';
import FilterModeSelector from '../FilterModeSelector/FilterModeSelector';
import FilterMessageLimitsForm from '../FilterMessageLimitsForm/FilterMessageLimitsForm';
import FilterMessageDatesForm from '../FilterMessageDatesForm/FilterMessageDatesForm';
import ActiveUserSelector from '../ActiveUserSelector/ActiveUserSelector';

import * as S from './style';
import {
  activeUserAtom,
  isAnonymousAtom,
  isMenuOpenAtom,
  messagesDateBoundsAtom,
  participantsAtom,
  showImagesAtom,
  showContentAtom,
  showDateAtom,
  showAuthorAtom,
  showOriginalImageSizeAtom,
  uniformTextSizeAtom,
  textThreadWidthAtom,
  textThreadHeightAtom,
  textThreadFontSizeAtom,
  gridViewAtom,
  gridColumnsAtom,
  gridRowsAtom,
} from '../../stores/global';
import {
  datesAtom,
  globalFilterModeAtom,
  limitsAtom,
  textFilterAtom,
} from '../../stores/filters';
import { FilterMode } from '../../types';

function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useAtom(isMenuOpenAtom);
  const [isAnonymous, setIsAnonymous] = useAtom(isAnonymousAtom);
  const [filterMode, setFilterMode] = useState<FilterMode>('index');
  const setGlobalFilterMode = useSetAtom(globalFilterModeAtom);
  const [limits, setLimits] = useAtom(limitsAtom);
  const setDates = useSetAtom(datesAtom);
  const messagesDateBounds = useAtomValue(messagesDateBoundsAtom);
  const participants = useAtomValue(participantsAtom);
  const [activeUser, setActiveUser] = useAtom(activeUserAtom);
  const [textFilter, setTextFilter] = useAtom(textFilterAtom);
  const [showImages, setShowImages] = useAtom(showImagesAtom);
  const [showContent, setShowContent] = useAtom(showContentAtom);
  const [showDate, setShowDate] = useAtom(showDateAtom);
  const [showAuthor, setShowAuthor] = useAtom(showAuthorAtom);
  const [showOriginalImageSize, setShowOriginalImageSize] = useAtom(showOriginalImageSizeAtom);
  const [uniformTextSize, setUniformTextSize] = useAtom(uniformTextSizeAtom);
  const [textThreadWidth, setTextThreadWidth] = useAtom(textThreadWidthAtom);
  const [textThreadHeight, setTextThreadHeight] = useAtom(textThreadHeightAtom);
  const [textThreadFontSize, setTextThreadFontSize] = useAtom(textThreadFontSizeAtom);
  const [gridView, setGridView] = useAtom(gridViewAtom);
  const [gridColumns, setGridColumns] = useAtom(gridColumnsAtom);
  const [gridRows, setGridRows] = useAtom(gridRowsAtom);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  const setMessageLimits = (e: React.FormEvent<HTMLFormElement>) => {
    const entries = Object.fromEntries(new FormData(e.currentTarget));
    e.preventDefault();
    setLimits({
      low: parseInt(entries.lowerLimit as string, 10),
      high: parseInt(entries.upperLimit as string, 10),
    });
    setGlobalFilterMode('index');
  };

  const setMessagesByDate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDates({
      start: e.currentTarget.startDate.valueAsDate,
      end: e.currentTarget.endDate.valueAsDate,
    });
    setGlobalFilterMode('date');
  };

  const adjustTextWidth = (delta: number) => {
    setTextThreadWidth(prev => Math.max(100, Math.min(prev + delta, 2000))); // 400 increments from 100 to 2000
  };

  const adjustTextHeight = (delta: number) => {
    setTextThreadHeight(prev => Math.max(100, Math.min(prev + delta, 2000))); // 400 increments from 100 to 2000
  };

  const adjustTextFontSize = (delta: number) => {
    setTextThreadFontSize(prev => Math.max(8, Math.min(prev + delta, 408))); // 400 increments from 8 to 408
  };

  const adjustGridColumns = (delta: number) => {
    setGridColumns(prev => Math.max(1, Math.min(prev + delta, 10))); // 1 to 10 columns
  };

  const adjustGridRows = (delta: number) => {
    setGridRows(prev => Math.max(1, Math.min(prev + delta, 10))); // 1 to 10 rows
  };

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => document.removeEventListener('keydown', keyDownHandler);
  }, [setIsMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) closeButtonRef.current?.focus();
    else openButtonRef.current?.focus();
  }, [isMenuOpen]);

  return (
    <>
      <S.MenuOpenButton
        className="menu-open-button"
        type="button"
        onClick={() => setIsMenuOpen(true)}
        ref={openButtonRef}
      >
        Open menu
      </S.MenuOpenButton>
      <S.Overlay
        type="button"
        $isActive={isMenuOpen}
        onClick={() => setIsMenuOpen(false)}
        tabIndex={-1}
      />
      <S.Sidebar $isOpen={isMenuOpen}>
        <S.MenuCloseButton
          type="button"
          onClick={() => setIsMenuOpen(false)}
          ref={closeButtonRef}
        >
          Close menu
        </S.MenuCloseButton>
        <S.SidebarContainer>
          <S.SidebarChildren>
            <FilterModeSelector
              filterMode={filterMode}
              setFilterMode={setFilterMode}
            />
            {filterMode === 'index' && (
              <FilterMessageLimitsForm
                limits={limits}
                setMessageLimits={setMessageLimits}
              />
            )}
            {filterMode === 'date' && (
              <FilterMessageDatesForm
                messagesDateBounds={messagesDateBounds}
                setMessagesByDate={setMessagesByDate}
              />
            )}
            <ActiveUserSelector
              participants={participants}
              activeUser={activeUser}
              setActiveUser={setActiveUser}
            />
            <S.Field>
              <S.Label htmlFor="is-anonymous">Anonymize users</S.Label>
              <S.ToggleCheckbox
                id="is-anonymous"
                type="checkbox"
                checked={isAnonymous}
                onChange={() =>
                  startTransition(() => setIsAnonymous(bool => !bool))
                }
              />
            </S.Field>
            <S.Field>
              <S.Label htmlFor="text-filter">Filter by text</S.Label>
              <S.Input
                id="text-filter"
                type="text"
                value={textFilter}
                onChange={e => setTextFilter(e.target.value)}
                placeholder="Enter text to filter messages"
              />
            </S.Field>
            <S.Fieldset>
              <legend>Show elements</legend>
              <S.Field>
                <S.Label htmlFor="show-images">Images</S.Label>
                <S.ToggleCheckbox
                  id="show-images"
                  type="checkbox"
                  checked={showImages}
                  onChange={() => setShowImages(bool => !bool)}
                />
              </S.Field>
              <S.Field>
                <S.Label htmlFor="show-original-image-size">Original Image Size</S.Label>
                <S.ToggleCheckbox
                  id="show-original-image-size"
                  type="checkbox"
                  checked={showOriginalImageSize}
                  onChange={() => setShowOriginalImageSize(bool => !bool)}
                />
              </S.Field>
              <S.Field>
                <S.Label htmlFor="show-content">Content</S.Label>
                <S.ToggleCheckbox
                  id="show-content"
                  type="checkbox"
                  checked={showContent}
                  onChange={() => setShowContent(bool => !bool)}
                />
              </S.Field>
              <S.Field>
                <S.Label htmlFor="show-date">Date</S.Label>
                <S.ToggleCheckbox
                  id="show-date"
                  type="checkbox"
                  checked={showDate}
                  onChange={() => setShowDate(bool => !bool)}
                />
              </S.Field>
              <S.Field>
                <S.Label htmlFor="show-author">Author</S.Label>
                <S.ToggleCheckbox
                  id="show-author"
                  type="checkbox"
                  checked={showAuthor}
                  onChange={() => setShowAuthor(bool => !bool)}
                />
              </S.Field>
            </S.Fieldset>
            <S.Fieldset>
              <legend>Text Thread Size</legend>
              <S.Field>
                <S.Label htmlFor="uniform-text-size">Uniform Text Size</S.Label>
                <S.ToggleCheckbox
                  id="uniform-text-size"
                  type="checkbox"
                  checked={uniformTextSize}
                  onChange={() => setUniformTextSize(bool => !bool)}
                />
              </S.Field>
              <S.Field>
                <S.Label>Text Width: {textThreadWidth}px</S.Label>
                <S.ButtonGroup>
                  <S.AdjustButton type="button" onClick={() => adjustTextWidth(-10)}>↓</S.AdjustButton>
                  <S.AdjustButton type="button" onClick={() => adjustTextWidth(10)}>↑</S.AdjustButton>
                </S.ButtonGroup>
              </S.Field>
              <S.Field>
                <S.Label>Text Height: {textThreadHeight}px</S.Label>
                <S.ButtonGroup>
                  <S.AdjustButton type="button" onClick={() => adjustTextHeight(-10)}>↓</S.AdjustButton>
                  <S.AdjustButton type="button" onClick={() => adjustTextHeight(10)}>↑</S.AdjustButton>
                </S.ButtonGroup>
              </S.Field>
              <S.Field>
                <S.Label>Text Font Size: {textThreadFontSize}px</S.Label>
                <S.ButtonGroup>
                  <S.AdjustButton type="button" onClick={() => adjustTextFontSize(-1)}>↓</S.AdjustButton>
                  <S.AdjustButton type="button" onClick={() => adjustTextFontSize(1)}>↑</S.AdjustButton>
                </S.ButtonGroup>
              </S.Field>
            </S.Fieldset>
            <S.Fieldset>
              <legend>View Mode</legend>
              <S.Field>
                <S.Label htmlFor="grid-view">Grid View</S.Label>
                <S.ToggleCheckbox
                  id="grid-view"
                  type="checkbox"
                  checked={gridView}
                  onChange={() => setGridView(bool => !bool)}
                />
              </S.Field>
              {gridView && (
                <>
                  <S.Field>
                    <S.Label>Grid Columns: {gridColumns}</S.Label>
                    <S.ButtonGroup>
                      <S.AdjustButton type="button" onClick={() => adjustGridColumns(-1)}>↓</S.AdjustButton>
                      <S.AdjustButton type="button" onClick={() => adjustGridColumns(1)}>↑</S.AdjustButton>
                    </S.ButtonGroup>
                  </S.Field>
                  <S.Field>
                    <S.Label>Grid Rows: {gridRows}</S.Label>
                    <S.ButtonGroup>
                      <S.AdjustButton type="button" onClick={() => adjustGridRows(-1)}>↓</S.AdjustButton>
                      <S.AdjustButton type="button" onClick={() => adjustGridRows(1)}>↑</S.AdjustButton>
                    </S.ButtonGroup>
                  </S.Field>
                </>
              )}
            </S.Fieldset>
          </S.SidebarChildren>
          <Credits />
        </S.SidebarContainer>
      </S.Sidebar>
    </>
  );
}

export default Sidebar;
Steps:

Open src/components/Sidebar/Sidebar.tsx.
Replace the existing code with the above.
The changes include:
Importing new atoms.
Adding state hooks for new settings.
Adding adjustment functions for text width, height, font size, grid columns, and rows.
Adding new UI controls in the Sidebar (toggles and buttons).
Save the file.
3. Update src/components/Sidebar/style.ts
Add styles for the scrollable sidebar and adjustment buttons.

Amended Code:

typescript

複製
// src/components/Sidebar/style.ts
import styled, { css } from 'styled-components';
import {
  hideText,
  normalizeButton,
  normalizeInput,
  standardButton,
} from '../../utils/styles';
import { whatsappThemeColor } from '../../utils/colors';
import { zIndex } from '../../utils/z-index';

const buttonSize = '44px';
const selectArrowWidth = '10px';
const selectArrowHeight = '5px';
const selectPadding = '0.3rem';

const inputStyles = css`
  ${normalizeInput}
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  width: 100%;
  height: 1.8rem;
  padding: 0 0.3rem;
  background-color: #fafafa;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.07);
  @media (prefers-color-scheme: dark) {
    background-color: #222;
  }
`;

const MenuOpenButton = styled.button`
  ${normalizeButton}
  ${hideText}
  position: fixed;
  width: ${buttonSize};
  height: ${buttonSize};
  left: 1rem;
  bottom: 1rem;
  border-radius: 50%;
  background-color: ${whatsappThemeColor};
  &::after {
    content: '';
    display: block;
    position: absolute;
    width: 16px;
    height: 2px;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
    background-color: white;
    box-shadow: 0 -5px 0 white, 0 5px 0 white;
  }
  @media (min-width: 700px) {
    left: 2rem;
    bottom: 2rem;
  }
`;

const MenuCloseButton = styled.button`
  ${normalizeButton}
  ${hideText}
  position: absolute;
  width: ${buttonSize};
  height: ${buttonSize};
  top: 0;
  right: 0;
  background-color: transparent;
  opacity: 0.5;
  transition: opacity 0.3s ease;
  &:hover, &:focus {
    opacity: 1;
  }
  &::before, &::after {
    content: '';
    display: block;
    position: absolute;
    width: 20px;
    height: 2px;
    top: 50%;
    left: 50%;
    transform-origin: 50% 50%;
    background-color: black;
  }
  &::before {
    transform: translate3d(-50%, -50%, 0) rotate(45deg);
  }
  &::after {
    transform: translate3d(-50%, -50%, 0) rotate(135deg);
  }
  @media (prefers-color-scheme: dark) {
    &::before, &::after {
      background-color: white;
    }
  }
`;

const Overlay = styled.button<{ $isActive: boolean }>`
  ${normalizeButton}
  display: block;
  position: fixed;
  width: 100%;
  top: 0;
  bottom: 0;
  background-color: black;
  opacity: ${props => (props.$isActive ? 0.2 : 0)};
  transition: opacity 0.3s ease;
  z-index: ${zIndex.overlay};
  ${props => !props.$isActive && css`pointer-events: none;`}
`;

const Sidebar = styled.aside<{ $isOpen: boolean }>`
  position: fixed;
  width: 280px;
  top: 0;
  left: 0;
  bottom: 0;
  background-color: white;
  transform: translate3d(${props => (props.$isOpen ? 0 : '-100%')}, 0, 0);
  transition: transform 0.3s ease;
  z-index: ${zIndex.sidebar};
  @media (prefers-color-scheme: dark) {
    background-color: #262d31;
  }
`;

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: absolute;
  top: ${buttonSize};
  left: 0;
  bottom: 0;
  right: 0;
  padding: 1rem;
  border-top: 1px solid #eee;
  overflow-y: auto; // Enable scrolling
  @media (prefers-color-scheme: dark) {
    border-color: #444;
  }
`;

const SidebarChildren = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ToggleCheckbox = styled.input`
  --toggle-width: 44px;
  --toggle-height: 22px;
  --toggle-padding: 2px;
  appearance: none;
  margin: 0;
  display: flex;
  padding: var(--toggle-padding);
  height: var(--toggle-height);
  width: var(--toggle-width);
  background-color: #aaa;
  border-radius: var(--toggle-height);
  cursor: pointer;
  &::before {
    content: '';
    aspect-ratio: 1;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s;
  }
  &:checked {
    background-color: ${whatsappThemeColor};
    &::before {
      transform: translateX(
        calc(
          (var(--toggle-width) - var(--toggle-padding) * 2) -
            (var(--toggle-height) - var(--toggle-padding) * 2)
        )
      );
    }
  }
`;

const Form = styled.form`
  > * + * {
    margin-top: 1rem;
  }
`;

const Field = styled.div`
  > * + * {
    margin-top: 0.375rem;
  }
`;

const RadioField = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
  & + & {
    margin-top: 0.5rem;
  }
`;

const Label = styled.label`
  display: block;
  opacity: 0.8;
  width: 100%;
  &:hover {
    cursor: pointer;
  }
`;

const Fieldset = styled.fieldset`
  margin: 0;
  border: 1px solid #eee;
  @media (prefers-color-scheme: dark) {
    border-color: #444;
  }
  ${Field} + ${Field} {
    margin-top: 1rem;
  }
`;

const Input = styled.input`
  ${inputStyles}
`;

const Select = styled.select`
  ${inputStyles}
  padding: 0 calc(${selectPadding} * 2 + ${selectArrowWidth}) 0 ${selectPadding};
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: calc(100% - ${selectPadding} - ${selectArrowWidth} / 2) 60%,
    calc(100% - ${selectPadding}) 60%;
  background-size: calc(${selectArrowWidth} / 2) ${selectArrowHeight};
  background-repeat: no-repeat;
  &:disabled {
    opacity: 0.5;
  }
`;

const Submit = styled.input`
  ${normalizeInput}
  ${standardButton}
`;

const InputDescription = styled.div`
  font-size: 80%;
  opacity: 0.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AdjustButton = styled.button`
  ${normalizeButton}
  ${standardButton}
  width: 40px;
  height: 30px;
  font-size: 16px;
`;

export {
  MenuOpenButton,
  MenuCloseButton,
  Overlay,
  Sidebar,
  SidebarContainer,
  SidebarChildren,
  Form,
  Field,
  Fieldset,
  InputDescription,
  Input,
  Select,
  Submit,
  RadioField,
  Label,
  ToggleCheckbox,
  ButtonGroup,
  AdjustButton,
};
Steps:

Open src/components/Sidebar/style.ts.
Replace the existing code with the above.
Key changes:
Added overflow-y: auto to SidebarContainer to enable scrolling.
Added ButtonGroup and AdjustButton styles for the new adjustment buttons.
Save the file.
4. Update src/components/Message/Message.tsx
Modify the rendering of images to respect the showOriginalImageSize setting and adjust text messages for uniform size and truncation.

Amended Code:

typescript

複製
// src/components/Message/Message.tsx
import { Suspense } from 'react';
import Linkify from 'react-linkify';
import { useAtomValue } from 'jotai';

import Attachment from '../Attachment/Attachment';
import Poll from '../Poll/Poll';
import * as S from './style';
import { IndexedMessage } from '../../types';
import { parsePollMessage } from '../../utils/poll-parser';
import {
  showDateAtom,
  showAuthorAtom,
  showOriginalImageSizeAtom,
  uniformTextSizeAtom,
  textThreadWidthAtom,
  textThreadHeightAtom,
  textThreadFontSizeAtom,
} from '../../stores/global';

function Link(
  decoratedHref: string,
  decoratedText: string,
  key: number,
): React.ReactNode | undefined {
  return (
    <a key={key} target="_blank" rel="noopener noreferrer" href={decoratedHref}>
      {decoratedText}
    </a>
  );
}

interface IMessage {
  message: IndexedMessage;
  color: string;
  isActiveUser: boolean;
  sameAuthorAsPrevious: boolean;
}

function Message({
  message,
  color,
  isActiveUser,
  sameAuthorAsPrevious,
}: IMessage) {
  const isSystem = !message.author;
  const showDate = useAtomValue(showDateAtom);
  const showAuthor = useAtomValue(showAuthorAtom);
  const showOriginalImageSize = useAtomValue(showOriginalImageSizeAtom);
  const uniformTextSize = useAtomValue(uniformTextSizeAtom);
  const textThreadWidth = useAtomValue(textThreadWidthAtom);
  const textThreadHeight = useAtomValue(textThreadHeightAtom);
  const textThreadFontSize = useAtomValue(textThreadFontSizeAtom);
  const dateTime = message.date.toISOString().slice(0, 19).replace('T', ' ');
  const pollData = parsePollMessage(message.message);
  let messageComponent;

  if (message.attachment) {
    messageComponent = (
      <Suspense fallback={`Loading ${message.attachment.fileName}...`}>
        <Attachment
          fileName={message.attachment.fileName}
          showOriginalSize={showOriginalImageSize}
        />
      </Suspense>
    );
  } else if (pollData !== null) {
    messageComponent = <Poll pollData={pollData} />;
  } else {
    messageComponent = (
      <Linkify componentDecorator={Link}>
        <S.Message
          $uniformTextSize={uniformTextSize}
          $textThreadWidth={textThreadWidth}
          $textThreadHeight={textThreadHeight}
          $textThreadFontSize={textThreadFontSize}
        >
          {message.message}
        </S.Message>
      </Linkify>
    );
  }

  return (
    <S.Item
      $isSystem={isSystem}
      $isActiveUser={isActiveUser}
      $sameAuthorAsPrevious={sameAuthorAsPrevious}
    >
      <S.Bubble
        $isSystem={isSystem}
        $isActiveUser={isActiveUser}
        $uniformTextSize={uniformTextSize}
        $textThreadWidth={textThreadWidth}
        $textThreadHeight={textThreadHeight}
      >
        <S.Index $isSystem={isSystem} $isActiveUser={isActiveUser}>
          {(message.index + 1).toLocaleString('de-CH')}
        </S.Index>
        <S.Wrapper>
          {!isSystem && !sameAuthorAsPrevious && showAuthor && (
            <S.Author color={color}>{message.author}</S.Author>
          )}
          {messageComponent}
        </S.Wrapper>
        {!isSystem && showDate && (
          <S.Date dateTime={dateTime}>
            {new Intl.DateTimeFormat('default', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }).format(message.date)}
          </S.Date>
        )}
      </S.Bubble>
    </S.Item>
  );
}

export default Message;
Steps:

Open src/components/Message/Message.tsx.
Replace the existing code with the above.
Key changes:
Imported new atoms for image size and text thread settings.
Passed showOriginalSize to the Attachment component.
Added props to Message component for uniform text size settings.
Applied dynamic styles to the Message component for text truncation.
Save the file.
5. Update src/components/Attachment/Attachment.tsx
Modify the Attachment component to handle the showOriginalSize prop.

Amended Code:

typescript

複製
// src/components/Attachment/Attachment.tsx
import { useEffect, useState, useCallback } from 'react';
import { useAtomValue } from 'jotai';

import { extractedFileAtom } from '../../stores/global';
import { getMimeType } from '../../utils/utils';

import * as S from './style';

const renderAttachment = (
  fileName: string,
  mimeType: string,
  attachment: string,
  showOriginalSize: boolean,
) => {
  const src = `data:${mimeType};base64,${attachment}`;

  if (mimeType.startsWith('image/')) {
    return <img src={src} title={fileName} alt="" style={showOriginalSize ? {} : { maxWidth: '100%' }} />;
  }
  if (mimeType.startsWith('video/')) {
    return (
      <video controls title={fileName}>
        <source src={src} type={mimeType} />
      </video>
    );
  }
  if (mimeType.startsWith('audio/')) {
    return <audio controls src={src} title={fileName} />;
  }
  return (
    <a href={attachment} download={fileName}>
      {fileName}
    </a>
  );
};

interface IAttachment {
  fileName: string;
  showOriginalSize?: boolean;
}

function Attachment({ fileName, showOriginalSize = false }: IAttachment) {
  const extractedFile = useAtomValue(extractedFileAtom);
  const [attachment, setAttachment] = useState<null | string>(null);
  const [error, setError] = useState<null | Error>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mimeType = getMimeType(fileName) || '';

  const loadAttachment = useCallback(() => {
    if (!extractedFile || typeof extractedFile === 'string') return;

    const file = extractedFile.files[fileName];

    if (!file) {
      setError(new Error(`Can't find "${fileName}" in archive`));
      return;
    }
    if (mimeType) {
      setIsLoading(true);
      file.async('base64').then(data => {
        setAttachment(data);
        setIsLoading(false);
      });
      return;
    }

    const sizeLimit = 250 * 1024 * 1024; // 250 MB
    // @ts-expect-error _data is not typed
    // eslint-disable-next-line no-underscore-dangle
    const uncompressedSize = file?._data?.uncompressedSize ?? -1;

    if (uncompressedSize > 0 && uncompressedSize < sizeLimit) {
      setIsLoading(true);
      file.async('blob').then(blob => {
        setAttachment(URL.createObjectURL(blob));
        setIsLoading(false);
      });
      return;
    }

    setError(new Error(`Can't load "${fileName}" as it exceeds 250MB`));
  }, [extractedFile, fileName, mimeType]);

  useEffect(() => {
    if (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('audio/') ||
      mimeType.startsWith('video/')
    ) {
      loadAttachment();
    }
  }, [loadAttachment, mimeType]);

  if (error) return <div>{error.toString()}</div>;
  if (attachment) {
    return renderAttachment(fileName, mimeType, attachment, showOriginalSize);
  }
  return (
    <div>
      {isLoading ? (
        <div>Loading {fileName}...</div>
      ) : (
        <S.Button type="button" onClick={loadAttachment}>
          Load {fileName}
        </S.Button>
      )}
    </div>
  );
}

export default Attachment;
Steps:

Open src/components/Attachment/Attachment.tsx.
Replace the existing code with the above.
Key changes:
Added showOriginalSize prop to the Attachment component.
Modified renderAttachment to apply maxWidth: '100%' only when showOriginalSize is false.
Save the file.
6. Update src/components/Message/style.ts
Update styles to support adjustable text thread sizes and truncation with "..." and four lines of blurred space.

Amended Code:

typescript

複製
// src/components/Message/style.ts
import styled, { css } from 'styled-components';
import {
  overflowBreakWord,
  messageBaseStyle,
} from '../../utils/styles';
import {
  systemBackgroundColor,
  systemDarkBackgroundColor,
  activeUserBackgroundColor,
  activeUserDarkBackgroundColor,
} from '../../utils/colors';

const Item = styled.li<{
  $isSystem: boolean;
  $isActiveUser: boolean;
  $sameAuthorAsPrevious: boolean;
}>`
  margin: 1rem auto;
  text-align: center;
  ${props =>
    props.$sameAuthorAsPrevious &&
    css`
      margin-top: 0.25rem;
    `}
  a {
    color: #68bbe4;
    text-decoration: underline;
  }
`;

const Index = styled.div<{ $isSystem: boolean; $isActiveUser: boolean }>`
  position: absolute;
  font-size: 10px;
  padding-inline: 7px;
  border-radius: 99px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  top: -0.5em;
  right: -0.5em;
  background-color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  ${props =>
    props.$isSystem &&
    css`
      background-color: ${systemBackgroundColor};
    `}
  ${props =>
    props.$isActiveUser &&
    css`
      background-color: ${activeUserBackgroundColor};
    `}
  .ctrl-down & {
    opacity: 1;
  }
  @media (prefers-color-scheme: dark) {
    background-color: #262d31;
    border-color: rgba(255, 255, 255, 0.1);
    color: #f1f1f2;
    ${props =>
      props.$isSystem &&
      css`
        background-color: ${systemDarkBackgroundColor};
      `}
    ${props =>
      props.$isActiveUser &&
      css`
        background-color: ${activeUserDarkBackgroundColor};
      `}
  }
`;

const Bubble = styled.div<{
  $isSystem: boolean;
  $isActiveUser: boolean;
  $uniformTextSize: boolean;
  $textThreadWidth: number;
  $textThreadHeight: number;
}>`
  ${messageBaseStyle}
  position: relative;
  background-color: white;
  width: ${props => (props.$uniformTextSize ? `${props.$textThreadWidth}px` : '400px')};
  ${props =>
    props.$uniformTextSize &&
    css`
      height: ${props.$textThreadHeight}px;
    `}
  ${props =>
    props.$isSystem &&
    css`
      background-color: ${systemBackgroundColor};
    `}
  ${props =>
    props.$isActiveUser &&
    css`
      text-align: left;
      background-color: ${activeUserBackgroundColor};
    `}
  @media (max-width: 450px) {
    width: ${props => (props.$uniformTextSize ? `${props.$textThreadWidth}px` : '90%')};
  }
  @media (max-width: 699px) {
    flex-direction: column;
  }
  @media (prefers-color-scheme: dark) {
    background-color: #262d31;
    color: #f1f1f2;
    ${props =>
      props.$isSystem &&
      css`
        background-color: ${systemDarkBackgroundColor};
        color: #fad964;
      `}
    ${props =>
      props.$isActiveUser &&
      css`
        background-color: ${activeUserDarkBackgroundColor};
      `}
  }
  &:hover {
    ${Index} {
      opacity: 1;
    }
  }
`;

const Wrapper = styled.div`
  flex: 1 1 auto;
  ${props =>
    props['data-uniform-text-size'] &&
    css`
      position: relative;
      overflow: hidden;
    `}
`;

const Author = styled.div`
  margin-bottom: 0.25rem;
  font-weight: bold;
  font-size: 75%;
  color: ${props => props.color};
`;

const Message = styled.div<{
  $uniformTextSize: boolean;
  $textThreadWidth: number;
  $textThreadHeight: number;
  $textThreadFontSize: number;
}>`
  ${overflowBreakWord}
  white-space: pre-wrap;
  ${props =>
    props.$uniformTextSize &&
    css`
      font-size: ${props.$textThreadFontSize}px;
      max-height: ${props.$textThreadHeight - 40}px; /* Reserve 4 lines (~40px) for blur */
      overflow: hidden;
      position: relative;
      &:after {
        content: '...';
        position: absolute;
        bottom: 0;
        right: 10px;
        font-size: ${props.$textThreadFontSize}px;
        color: #888;
      }
      /* Simulate 4 lines of blurred space */
      padding-bottom: 40px;
      background: linear-gradient(to bottom, transparent 60%, rgba(255, 255, 255, 0.8) 100%);
      @media (prefers-color-scheme: dark) {
        background: linear-gradient(to bottom, transparent 60%, rgba(38, 45, 49, 0.8) 100%);
      }
    `}
`;

const Date = styled.time`
  flex: 0 0 auto;
  align-self: flex-end;
  margin-left: 1rem;
  white-space: nowrap;
  font-size: 75%;
  opacity: 0.6;
  @media (max-width: 699px) {
    margin-top: 0.25rem;
  }
`;

export { Item, Bubble, Index, Wrapper, Author, Message, Date };
Steps:

Open src/components/Message/style.ts.
Replace the existing code with the above.
Key changes:
Added props to Bubble for uniformTextSize, textThreadWidth, and textThreadHeight.
Added props to Message for text size settings and implemented truncation with "..." and a blurred gradient for four lines.
Adjusted Wrapper to handle overflow for uniform text sizes.
Save the file.
7. Update src/components/MessageViewer/MessageViewer.tsx
Implement the grid view logic based on the gridView atom and adjust card sizes based on gridColumns and gridRows.

Amended Code:

typescript

複製
// src/components/MessageViewer/MessageViewer.tsx
import React, { useMemo, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';

import Message from '../Message/Message';
import * as S from './style';
import {
  activeUserAtom,
  messagesAtom,
  participantsAtom,
  showContentAtom,
  showImagesAtom,
  gridViewAtom,
  gridColumnsAtom,
  gridRowsAtom,
} from '../../stores/global';
import {
  datesAtom,
  globalFilterModeAtom,
  limitsAtom,
  textFilterAtom,
} from '../../stores/filters';
import { authorColors } from '../../utils/colors';
import {
  filterMessagesByDate,
  getISODateString,
  getMimeType,
} from '../../utils/utils';
import { parsePollMessage } from '../../utils/poll-parser';

function MessageViewer() {
  const limits = useAtomValue(limitsAtom);
  const [activeUser, setActiveUser] = useAtom(activeUserAtom);
  const participants = useAtomValue(participantsAtom);
  const messages = useAtomValue(messagesAtom);
  const filterMode = useAtomValue(globalFilterModeAtom);
  const textFilter = useAtomValue(textFilterAtom);
  const showContent = useAtomValue(showContentAtom);
  const showImages = useAtomValue(showImagesAtom);
  const gridView = useAtomValue(gridViewAtom);
  const gridColumns = useAtomValue(gridColumnsAtom);
  const gridRows = useAtomValue(gridRowsAtom);
  const { start: startDate, end: endDate } = useAtomValue(datesAtom);
  const endDatePlusOne = new Date(endDate);
  endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);

  const colorMap: Record<string, string> = useMemo(
    () =>
      participants.reduce(
        (obj, participant, i) => ({
          ...obj,
          [participant]: authorColors[i % authorColors.length],
        }),
        {},
      ),
    [participants],
  );

  const filteredMessages = useMemo(() => {
    let result = messages;
    if (textFilter) {
      result = result.filter(message =>
        message.message.toLowerCase().includes(textFilter.toLowerCase()),
      );
    }
    if (!showContent) {
      result = result.filter(
        message =>
          !message.message &&
          !message.attachment &&
          parsePollMessage(message.message) === null,
      );
    }
    if (!showImages) {
      result = result.filter(
        message =>
          !message.attachment ||
          !getMimeType(message.attachment.fileName)?.startsWith('image/'),
      );
    }
    if (filterMode === 'index') {
      result = result.slice(limits.low - 1, limits.high);
    } else {
      result = filterMessagesByDate(result, startDate, endDatePlusOne);
    }
    return result;
  }, [
    messages,
    textFilter,
    showContent,
    showImages,
    filterMode,
    limits,
    startDate,
    endDatePlusOne,
  ]);

  const isLimited =
    filteredMessages.length !== messages.length ||
    textFilter.length > 0 ||
    !showContent ||
    !showImages;

  useEffect(() => {
    setActiveUser(participants[0] || '');
  }, [setActiveUser, participants]);

  return (
    <S.Container>
      {messages.length > 0 && (
        <S.P>
          <S.Info>
            {isLimited && (
              <>
                {textFilter && (
                  <span>
                    Showing {filteredMessages.length} messages matching "
                    {textFilter}"
                  </span>
                )}
                {!showContent && (
                  <span>
                    Showing {filteredMessages.length} messages without content
                  </span>
                )}
                {!showImages && showContent && !textFilter && (
                  <span>
                    Showing {filteredMessages.length} messages without images
                  </span>
                )}
                {filterMode === 'index' && !textFilter && showContent && showImages && (
                  <span>
                    Showing messages {limits.low} to{' '}
                    {Math.min(limits.high, messages.length)} (
                    {filteredMessages.length} out of {messages.length})
                  </span>
                )}
                {filterMode === 'date' && !textFilter && showContent && showImages && (
                  <span>
                    Showing messages from {getISODateString(startDate)} to{' '}
                    {getISODateString(endDate)}
                  </span>
                )}
              </>
            )}
            {!isLimited && (
              <span>Showing all {messages.length} messages</span>
            )}
          </S.Info>
        </S.P>
      )}
      <S.List $gridView={gridView} $gridColumns={gridColumns} $gridRows={gridRows}>
        {filteredMessages.map((message, i, arr) => {
          const prevMessage = arr[i - 1];
          return (
            <Message
              key={message.index}
              message={message}
              color={colorMap[message.author || '']}
              isActiveUser={activeUser === message.author}
              sameAuthorAsPrevious={
                prevMessage && prevMessage.author === message.author
              }
            />
          );
        })}
      </S.List>
    </S.Container>
  );
}

export default React.memo(MessageViewer);
Steps:

Open src/components/MessageViewer/MessageViewer.tsx.
Replace the existing code with the above.
Key changes:
Imported new atoms for grid view settings.
Passed gridView, gridColumns, and gridRows to the List component for styling.
Save the file.
8. Update src/components/MessageViewer/style.ts
Add styles for the grid view layout, ensuring cards fit the screen and are uniform in size.

Amended Code:

typescript

複製
// src/components/MessageViewer/style.ts
import styled, { css } from 'styled-components';
import {
  whatsappThemeColor,
  viewerBackgroundColor,
  viewerDarkBackgroundColor,
} from '../../utils/colors';
import { messageBaseStyle } from '../../utils/styles';
import bgImage from '../../img/bg.png';
import bgDarkImage from '../../img/bg-dark.png';

const Container = styled.div`
  flex-grow: 1;
  padding: 0 1rem;
  background-color: ${viewerBackgroundColor};
  background-image: url(${bgImage});
  background-attachment: fixed;
  @media (min-width: 700px) {
    padding: 0 10%;
  }
  @media (prefers-color-scheme: dark) {
    background-color: ${viewerDarkBackgroundColor};
    background-image: url(${bgDarkImage});
  }
`;

const List = styled.ul<{ $gridView: boolean; $gridColumns: number; $gridRows: number }>`
  padding: 0;
  list-style: none;
  ${props =>
    props.$gridView &&
    css`
      display: grid;
      grid-template-columns: repeat(${props.$gridColumns}, 1fr);
      grid-template-rows: repeat(${props.$gridRows}, auto);
      gap: 1rem;
      justify-items: center;
      align-items: stretch;
      & > li {
        width: 100%;
        & > div { /* Bubble */
          width: 100% !important;
          height: 100%;
          box-sizing: border-box;
        }
      }
    `}
`;

const P = styled.p`
  text-align: center;
`;

const Info = styled.span`
  ${messageBaseStyle}
  text-align: center;
  background-color: ${whatsappThemeColor};
  color: white;
`;

export { Container, List, P, Info };
Steps:

Open src/components/MessageViewer/style.ts.
Replace the existing code with the above.
Key changes:
Added props to List for gridView, gridColumns, and gridRows.
Implemented grid layout with dynamic columns and rows, ensuring uniform card sizes.
Save the file.
9. Update src/types.ts
Add types for new settings.

Amended Code:

typescript

複製
// src/types.ts
import type { Message } from 'whatsapp-chat-parser';
import JSZip from 'jszip';

type FilterMode = 'index' | 'date';

type ExtractedFile = string | JSZip | null;

interface IndexedMessage extends Message {
  index: number;
}

interface ILimits {
  low: number;
  high: number;
}

interface DateBounds {
  start: Date;
  end: Date;
}

interface PollOption {
  text: string;
  votes: number;
}

interface PollStructure {
  title: string;
  options: PollOption[];
  maxVotes: number;
}

export type {
  FilterMode,
  ExtractedFile,
  IndexedMessage,
  ILimits,
  DateBounds,
  PollOption,
  PollStructure,
};
Steps:

Open src/types.ts.
The file remains unchanged as no new types are needed (all settings use primitive types).
Verify the file is correct and save.
Testing the Changes
Run the Application:
Use npm run dev or your equivalent command to start the development server.
Open the app in a browser (default: http://localhost:8000).
Test Image Size Toggle:
Open the Sidebar (click "Open menu").
Toggle "Original Image Size" under "Show elements".
Upload a chat with images and verify that images display in their original size when toggled on, and constrained to max-width: 100% when toggled off.
Ensure the "Show Images" toggle still hides/shows images without conflicts.
Test Text Thread Size Adjustment:
Toggle "Uniform Text Size" in the Sidebar.
Adjust "Text Width", "Text Height", and "Text Font Size" using the up/down buttons.
Verify that text threads resize uniformly when toggled on, with truncation and "..." at the bottom, leaving four lines of blurred space.
Test with extreme values (e.g., max width 2000px, font size 408px) to ensure stability.
Toggle off "Uniform Text Size" and verify that text threads revert to default sizes (400px width) without truncation.
Test Scrollable Sidebar:
Open the Sidebar and scroll to ensure all controls (including new ones) are accessible.
Verify that the Credits section remains visible at the bottom.
Test Grid View:
Toggle "Grid View" in the Sidebar.
Adjust "Grid Columns" and "Grid Rows" (1 to 10) using the up/down buttons.
Verify that messages display in a grid layout, filling the screen, with uniform card sizes.
Use arrow keys (if bound) or buttons to adjust grid dimensions and ensure responsiveness.
Toggle off "Grid View" to revert to the column layout.
Notes
Image Size Toggle: The showOriginalImageSize toggle works alongside showImages. When showImages is off, no images are shown, so the original size toggle has no effect in that case.
Text Thread Size: The adjustment buttons increment/decrement by 10px for width/height and 1px for font size, supporting 400 increments within reasonable bounds (100-2000px for dimensions, 8-408px for font size).
Grid View: The grid layout ensures cards are uniform and fit the screen, with dynamic column/row counts. Arrow key support for grid adjustments would require additional event listeners, which can be added if needed.
Scrollable Sidebar: The overflow-y: auto ensures all settings are accessible, even with the added controls.
If you encounter issues or need further refinements (e.g., arrow key support for grid adjustments), let me know!







3秒
no code for now just short answer, if your code works, i wanna copy paste and run to test one by one. Would it still runable if only change one by one one at a time


Yes, the code is modular, so you can apply changes to each file one at a time and test incrementally. The app should remain runnable after each change, as dependencies are handled within each file. Start with global.ts, then Sidebar files, followed by Message and Attachment files, and finally MessageViewer files to ensure compatibility. Test after each update to verify functionality.

```
