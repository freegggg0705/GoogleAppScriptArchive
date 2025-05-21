[https://grok.com/chat/aefdb89b-c14c-420f-97cc-f8ead121db6b](https://grok.com/share/c2hhcmQtMg%3D%3D_bc889402-1ffb-47fa-8855-9e4f928c5f00) ->GGGG
[https://grok.com/chat/6d94bf34-e889-4707-92c2-68926fc7a3d6](https://grok.com/share/bGVnYWN5_68df5a13-bc1d-406f-be00-9b620ed759cf) ->freeGGGG

Functionality change:
chat thread image all same size, align middle
filter text
enable to hide author, date, content or image

```
```Directory Structure:

└── ./
    ├── src
    │   ├── components
    │   │   ├── ActiveUserSelector
    │   │   │   └── ActiveUserSelector.tsx
    │   │   ├── Attachment
    │   │   │   ├── Attachment.tsx
    │   │   │   └── style.ts
    │   │   ├── Credits
    │   │   │   └── Credits.tsx
    │   │   ├── Dropzone
    │   │   │   ├── Dropzone.tsx
    │   │   │   └── style.ts
    │   │   ├── FilterMessageDatesForm
    │   │   │   └── FilterMessageDatesForm.tsx
    │   │   ├── FilterMessageLimitsForm
    │   │   │   └── FilterMessageLimitsForm.tsx
    │   │   ├── FilterModeSelector
    │   │   │   └── FilterModeSelector.tsx
    │   │   ├── Message
    │   │   │   ├── Message.tsx
    │   │   │   └── style.ts
    │   │   ├── MessageViewer
    │   │   │   ├── MessageViewer.tsx
    │   │   │   └── style.ts
    │   │   ├── Poll
    │   │   │   ├── Poll.tsx
    │   │   │   └── style.ts
    │   │   └── Sidebar
    │   │       ├── Sidebar.tsx
    │   │       └── style.ts
    │   ├── stores
    │   │   ├── filters.ts
    │   │   └── global.ts
    │   ├── utils
    │   │   ├── colors.ts
    │   │   ├── poll-parser.ts
    │   │   ├── styles.ts
    │   │   ├── unique-id-generator.ts
    │   │   ├── utils.ts
    │   │   └── z-index.ts
    │   ├── App.tsx
    │   ├── declarations.d.ts
    │   ├── index.tsx
    │   ├── style.ts
    │   └── types.ts
    ├── index.html
    └── vite.config.ts



---
File: /src/components/ActiveUserSelector/ActiveUserSelector.tsx
---

import type { SetStateAction } from 'jotai';

import * as S from '../Sidebar/style';

interface IActiveUserSelector {
  participants: string[];
  activeUser: string;
  setActiveUser: (activeUser: SetStateAction<string>) => void;
}

function ActiveUserSelector({
  participants,
  activeUser,
  setActiveUser,
}: IActiveUserSelector) {
  return (
    <S.Field>
      <S.Label htmlFor="active-user">Active user</S.Label>
      <S.Select
        id="active-user"
        disabled={!participants.length}
        value={activeUser}
        onChange={e => {
          setActiveUser(e.target.value);
        }}
      >
        {participants.map(participant => (
          <option key={participant} value={participant}>
            {participant}
          </option>
        ))}
      </S.Select>
    </S.Field>
  );
}

export default ActiveUserSelector;



---
File: /src/components/Attachment/Attachment.tsx
---

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
) => {
  const src = `data:${mimeType};base64,${attachment}`;

  if (mimeType.startsWith('image/')) {
    return <img src={src} title={fileName} alt="" />;
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
}

function Attachment({ fileName }: IAttachment) {
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

    // We actually need to check > 0 because big files have negative numbers (int overflow? kek)
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
    return renderAttachment(fileName, mimeType, attachment);
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

---
File: /src/components/Attachment/style.ts
---

import styled from 'styled-components';

import { normalizeInput, standardButton } from '../../utils/styles';

const Button = styled.button`
  ${normalizeInput}
  ${standardButton}
`;

export { Button };



---
File: /src/components/Credits/Credits.tsx
---

function Credits() {
  return (
    <div>
      <small>
        Made by <a href="https://lorisbettazza.com">Loris Bettazza</a>
        <br />
        View{' '}
        <a href="https://github.com/Pustur/whatsapp-chat-parser-website">
          Source code
        </a>
      </small>
    </div>
  );
}

export default Credits;



---
File: /src/components/Dropzone/Dropzone.tsx
---

import { useState, useRef, useEffect } from 'react';

import * as S from './style';

const preventDefaults = (e: React.DragEvent<HTMLFormElement>) => {
  e.preventDefault();
  e.stopPropagation();
};

interface IDropzone {
  id: string;
  onFileUpload: (e: File) => void;
}

function Dropzone({ id, onFileUpload }: IDropzone) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDragEnterOverHandler = (e: React.DragEvent<HTMLFormElement>) => {
    preventDefaults(e);
    setIsHighlighted(true);
  };

  const onDragLeaveHandler = (e: React.DragEvent<HTMLFormElement>) => {
    preventDefaults(e);
    setIsHighlighted(false);
  };

  const onDropHandler = (e: React.DragEvent<HTMLFormElement>) => {
    preventDefaults(e);
    setIsHighlighted(false);
    onFileUpload(e.dataTransfer.files[0]);
  };

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(e.target.files[0]);
    }
  };

  useEffect(() => {
    // setTimeout to steal the focus from MenuOpenButton (only on first render)
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  return (
    <form
      onDragEnter={onDragEnterOverHandler}
      onDragOver={onDragEnterOverHandler}
      onDragLeave={onDragLeaveHandler}
      onDrop={onDropHandler}
    >
      <S.Input
        id={id}
        type="file"
        accept="text/plain, application/zip"
        ref={inputRef}
        onChange={onChangeHandler}
      />
      <S.Label htmlFor={id} $isHighlighted={isHighlighted}>
        <S.P>
          Click here to upload a file or drag and drop it onto the dashed region
          (supported formats: <S.Extension>txt</S.Extension>,{' '}
          <S.Extension>zip</S.Extension>)
        </S.P>
      </S.Label>
    </form>
  );
}

export default Dropzone;



---
File: /src/components/Dropzone/style.ts
---

import styled, { css } from 'styled-components';

import { whatsappThemeColor } from '../../utils/colors';
import { screenReaderOnly } from '../../utils/styles';

const labelHighlight = css`
  background-color: #eee;
  border-color: ${whatsappThemeColor};

  @media (prefers-color-scheme: dark) {
    background-color: #333a3d;
  }
`;

const Label = styled.label<{ $isHighlighted: boolean }>`
  display: block;
  border-radius: 10px;
  padding: 20px;
  border: 2px dashed #ccc;
  cursor: pointer;
  ${props => props.$isHighlighted && labelHighlight}

  @media (prefers-color-scheme: dark) {
    border-color: #666;
  }
`;

const P = styled.p`
  margin: 0;
`;

const Extension = styled.span`
  font-family: monospace;
  background-color: #eee;
  border: 1px solid #ddd;
  border-radius: 2px;
  display: inline-block;
  padding: 1px 3px;

  @media (prefers-color-scheme: dark) {
    background-color: #222;
    border-color: #222;
  }
`;

const Input = styled.input`
  ${screenReaderOnly}

  &:focus + ${Label} {
    ${labelHighlight}
  }
`;

export { Label, P, Extension, Input };



---
File: /src/components/FilterMessageDatesForm/FilterMessageDatesForm.tsx
---

import { DateBounds } from '../../types';
import { getISODateString } from '../../utils/utils';

import * as S from '../Sidebar/style';

interface IFilterMessageDatesForm {
  messagesDateBounds: DateBounds;
  setMessagesByDate: React.FormEventHandler<HTMLFormElement>;
}

function FilterMessageDatesForm({
  messagesDateBounds,
  setMessagesByDate,
}: IFilterMessageDatesForm) {
  return (
    <S.Form onSubmit={setMessagesByDate}>
      <S.Fieldset>
        <legend>Messages date window</legend>
        <S.Field>
          <S.Label htmlFor="start-date">Start</S.Label>
          <S.Input
            id="start-date"
            name="startDate"
            type="date"
            min={getISODateString(messagesDateBounds.start)}
            max={getISODateString(messagesDateBounds.end)}
            defaultValue={getISODateString(messagesDateBounds.start)}
          />
        </S.Field>
        <S.Field>
          <S.Label htmlFor="end-date">End</S.Label>
          <S.Input
            id="end-date"
            name="endDate"
            type="date"
            min={getISODateString(messagesDateBounds.start)}
            max={getISODateString(messagesDateBounds.end)}
            defaultValue={getISODateString(messagesDateBounds.end)}
          />
        </S.Field>
        <S.Field>
          <S.Submit type="submit" value="Apply" />
          <S.InputDescription>
            A high delta may freeze the page for a while, change this with
            caution
          </S.InputDescription>
        </S.Field>
      </S.Fieldset>
    </S.Form>
  );
}

export default FilterMessageDatesForm;



---
File: /src/components/FilterMessageLimitsForm/FilterMessageLimitsForm.tsx
---

import * as S from '../Sidebar/style';

import { ILimits } from '../../types';

interface IFilterMessageLimitsForm {
  limits: ILimits;
  setMessageLimits: React.FormEventHandler<HTMLFormElement>;
}

function FilterMessageLimitsForm({
  limits,
  setMessageLimits,
}: IFilterMessageLimitsForm) {
  return (
    <S.Form onSubmit={setMessageLimits}>
      <S.Fieldset>
        <legend>Messages limit</legend>
        <S.Field>
          <S.Label htmlFor="lower-limit">Start</S.Label>
          <S.Input
            id="lower-limit"
            name="lowerLimit"
            type="number"
            min="1"
            placeholder={limits.low.toString()}
          />
        </S.Field>
        <S.Field>
          <S.Label htmlFor="upper-limit">End</S.Label>
          <S.Input
            id="upper-limit"
            name="upperLimit"
            type="number"
            min="1"
            placeholder={limits.high.toString()}
          />
        </S.Field>
        <S.Field>
          <S.Submit type="submit" value="Apply" />
          <S.InputDescription>
            A high delta may freeze the page for a while, change this with
            caution
          </S.InputDescription>
        </S.Field>
      </S.Fieldset>
    </S.Form>
  );
}

export default FilterMessageLimitsForm;



---
File: /src/components/FilterModeSelector/FilterModeSelector.tsx
---

import { FilterMode } from '../../types';
import { capitalize } from '../../utils/utils';
import * as S from '../Sidebar/style';

interface IFilterModeSelector {
  filterMode: FilterMode;
  setFilterMode: React.Dispatch<React.SetStateAction<FilterMode>>;
}

function FilterModeSelector({
  filterMode,
  setFilterMode,
}: IFilterModeSelector) {
  return (
    <S.Fieldset>
      <legend>Filter by</legend>
      {['index', 'date'].map(name => (
        <S.RadioField key={name}>
          <input
            id={name}
            type="radio"
            value={name}
            checked={filterMode === name}
            onChange={e => setFilterMode(e.target.value as FilterMode)}
          />
          <S.Label htmlFor={name}>{capitalize(name)}</S.Label>
        </S.RadioField>
      ))}
    </S.Fieldset>
  );
}

export default FilterModeSelector;



---
File: /src/components/Message/Message.tsx
---

// src/components/Message/Message.tsx
import { Suspense } from 'react';
import Linkify from 'react-linkify';
import { useAtomValue } from 'jotai';

import Attachment from '../Attachment/Attachment';
import Poll from '../Poll/Poll';
import * as S from './style';
import { IndexedMessage } from '../../types';
import { parsePollMessage } from '../../utils/poll-parser';
import { showDateAtom, showAuthorAtom } from '../../stores/global';

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
  const dateTime = message.date.toISOString().slice(0, 19).replace('T', ' ');
  const pollData = parsePollMessage(message.message);
  let messageComponent = (
    <Linkify componentDecorator={Link}>
      <S.Message>{message.message}</S.Message>
    </Linkify>
  );

  if (message.attachment) {
    messageComponent = (
      <Suspense fallback={`Loading ${message.attachment.fileName}...`}>
        <Attachment fileName={message.attachment.fileName} />
      </Suspense>
    );
  } else if (pollData !== null) {
    messageComponent = <Poll pollData={pollData} />;
  }

  return (
    <S.Item
      $isSystem={isSystem}
      $isActiveUser={isActiveUser}
      $sameAuthorAsPrevious={sameAuthorAsPrevious}
    >
      <S.Bubble $isSystem={isSystem} $isActiveUser={isActiveUser}>
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



---
File: /src/components/Message/style.ts
---

import styled, { css } from 'styled-components';

import { overflowBreakWord, messageBaseStyle } from '../../utils/styles';
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
  margin: 1rem auto; // Center with auto margins
  text-align: center; // Center all cards
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

const Bubble = styled.div<{ $isSystem: boolean; $isActiveUser: boolean }>`
  ${messageBaseStyle}

  position: relative;
  background-color: white;
  width: 400px; // Fixed width for all cards
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
    width: 90%; // Responsive for small screens
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
`;

const Author = styled.div`
  margin-bottom: 0.25rem;
  font-weight: bold;
  font-size: 75%;
  color: ${props => props.color};
`;

const Message = styled.div`
  ${overflowBreakWord}

  white-space: pre-wrap;
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
---
File: /src/components/MessageViewer/MessageViewer.tsx
---

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

    // Apply text filter
    if (textFilter) {
      result = result.filter(message =>
        message.message.toLowerCase().includes(textFilter.toLowerCase()),
      );
    }

    // Apply content filter (exclude messages with text, attachments, or polls)
    if (!showContent) {
      result = result.filter(
        message =>
          !message.message &&
          !message.attachment &&
          parsePollMessage(message.message) === null,
      );
    }

    // Apply images filter (exclude messages with image attachments)
    if (!showImages) {
      result = result.filter(
        message =>
          !message.attachment ||
          !getMimeType(message.attachment.fileName)?.startsWith('image/'),
      );
    }

    // Apply index or date filter
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

      <S.List>
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


---
File: /src/components/MessageViewer/style.ts
---

import styled from 'styled-components';

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

const List = styled.ul`
  padding: 0;
  list-style: none;
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



---
File: /src/components/Poll/Poll.tsx
---

import { PollStructure } from '../../types';
import * as S from './style';

interface IPoll {
  pollData: PollStructure;
}

function Poll({ pollData }: IPoll) {
  return (
    <S.Poll>
      <S.Title>{pollData.title}</S.Title>
      {pollData.options.map(option => {
        return (
          <S.Option key={option.text}>
            <div>{option.text}</div>
            <S.Flex>
              <S.Progress max={pollData.maxVotes} value={option.votes} />
              <div>{option.votes}</div>
            </S.Flex>
          </S.Option>
        );
      })}
    </S.Poll>
  );
}

export default Poll;



---
File: /src/components/Poll/style.ts
---

import styled from 'styled-components';
import {
  activeUserDarkBackgroundColor,
  viewerDarkBackgroundColor,
  whatsappThemeColor,
} from '../../utils/colors';

const Poll = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Title = styled.div`
  font-weight: bolder;
`;

const Option = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const Flex = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.8rem;
`;

const Progress = styled.progress`
  display: block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
  height: 10px;
  appearance: none;
  border-radius: 99px;
  padding: 1px;

  &::-webkit-progress-bar {
    background-color: white;
    border-radius: 99px;
  }

  &::-webkit-progress-value {
    background-color: ${whatsappThemeColor};
    border-radius: 99px;
  }

  @media (prefers-color-scheme: dark) {
    &::-webkit-progress-bar {
      background-color: color-mix(
        in srgb,
        ${activeUserDarkBackgroundColor},
        ${viewerDarkBackgroundColor}
      );
    }
  }
`;

export { Poll, Title, Option, Flex, Progress };



---
File: /src/components/Sidebar/Sidebar.tsx
---

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
          </S.SidebarChildren>
          <Credits />
        </S.SidebarContainer>
      </S.Sidebar>
    </>
  );
}

export default Sidebar;


---
File: /src/components/Sidebar/style.ts
---

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
    box-shadow:
      0 -5px 0 white,
      0 5px 0 white;
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

  &:hover,
  &:focus {
    opacity: 1;
  }

  &::before,
  &::after {
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
    &::before,
    &::after {
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
  ${props =>
    !props.$isActive &&
    css`
      pointer-events: none;
    `}
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

  padding: 0 calc(${selectPadding} * 2 + ${selectArrowWidth}) 0
    ${selectPadding};
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position:
    calc(100% - ${selectPadding} - ${selectArrowWidth} / 2) 60%,
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
};



---
File: /src/stores/filters.ts
---

import { atom } from 'jotai';

import { DateBounds, FilterMode, ILimits } from '../types';

const DEFAULT_LOWER_LIMIT = 1;
const DEFAULT_UPPER_LIMIT = 100;

const globalFilterModeAtom = atom<FilterMode>('index');

const mergeLimits = (oldLimits: ILimits, newLimits: ILimits): ILimits => ({
  ...oldLimits,
  low: Number.isNaN(newLimits.low) ? DEFAULT_LOWER_LIMIT : newLimits.low,
  high: Number.isNaN(newLimits.high) ? DEFAULT_UPPER_LIMIT : newLimits.high,
});

const tempLimitsAtom = atom<ILimits>({
  low: DEFAULT_LOWER_LIMIT,
  high: DEFAULT_UPPER_LIMIT,
});

const limitsAtom = atom<ILimits, ILimits>(
  get => get(tempLimitsAtom),
  (get, set, limits) =>
    set(tempLimitsAtom, mergeLimits(get(tempLimitsAtom), limits)),
);

const datesAtom = atom<DateBounds>({
  start: new Date(),
  end: new Date(),
});

const textFilterAtom = atom<string>('');

export { globalFilterModeAtom, limitsAtom, datesAtom, textFilterAtom };

---
File: /src/stores/global.ts
---

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

// New visibility toggle atoms
const showImagesAtom = atom(true);
const showContentAtom = atom(true);
const showDateAtom = atom(true);
const showAuthorAtom = atom(true);

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
};


---
File: /src/utils/colors.ts
---

const viewerBackgroundColor = '#e5ddd5';
const viewerDarkBackgroundColor = '#0d1418';

const activeUserBackgroundColor = '#ddf7c8';
const activeUserDarkBackgroundColor = '#0e6162';
const systemBackgroundColor = '#fff5c4';
const systemDarkBackgroundColor = '#353526';

const whatsappThemeColor = '#07bc4c';

const authorColors = [
  '#1f7aec',
  '#fe7c7f',
  '#6bcbef',
  '#fc644b',
  '#35cd96',
  '#e542a3',
  '#91ab01',
  '#ba33dc',
  '#ffa97a',
  '#029d00',
  '#dfb610',
];

export {
  viewerBackgroundColor,
  viewerDarkBackgroundColor,
  systemBackgroundColor,
  systemDarkBackgroundColor,
  activeUserBackgroundColor,
  activeUserDarkBackgroundColor,
  whatsappThemeColor,
  authorColors,
};



---
File: /src/utils/poll-parser.ts
---

import { PollOption, PollStructure } from '../types';

function parsePollMessage(message: string): PollStructure | null {
  const lines = message
    .trim()
    .split('\n')
    .map(line => line.trim());

  if (!lines[0].includes('POLL:') || !lines[2]?.includes('OPTION:'))
    return null;

  const optionRegex = /OPTION: (?<text>.+) \((?<votes>\d+).*\)/;

  const options = lines.slice(2).reduce<PollOption[]>((acc, line) => {
    const match = optionRegex.exec(line);

    if (!match?.groups) return acc;

    const { text, votes } = match.groups;

    return acc.concat({ text, votes: Number(votes) });
  }, []);

  return {
    title: lines[1],
    options,
    maxVotes: Math.max(...options.map(o => o.votes)),
  };
}

export { parsePollMessage };



---
File: /src/utils/styles.ts
---

import { css } from 'styled-components';
import { whatsappThemeColor } from './colors';

const screenReaderOnly = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
`;

const hideText = css`
  text-indent: 101%;
  overflow: hidden;
  white-space: nowrap;
`;

const normalizeButton = css`
  font-size: 100%;
  font-family: inherit;
  padding: 0;
  border: 0;
  margin: 0;
  appearance: none;
  box-shadow: none;
`;

const normalizeInput = css`
  appearance: none;
  font: inherit;
  color: inherit;
`;

const overflowBreakWord = css`
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
`;

const messageBaseStyle = css`
  display: inline-flex;
  padding: 8px 10px;
  border-radius: 6px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
`;

const standardButton = css`
  border: 0;
  border-radius: 4px;
  width: 100%;
  height: 1.8rem;
  padding: 0 0.5rem;
  background-color: ${whatsappThemeColor};
  color: white;
  cursor: pointer;
`;

export {
  screenReaderOnly,
  hideText,
  normalizeButton,
  normalizeInput,
  overflowBreakWord,
  messageBaseStyle,
  standardButton,
};



---
File: /src/utils/unique-id-generator.ts
---

class UniqueIdGenerator {
  private cache: Map<string, number>;

  private currentNumber: number;

  constructor() {
    this.cache = new Map();
    this.currentNumber = 0;
  }

  public getId(str: string): number {
    const cachedNumber = this.cache.get(str);

    if (typeof cachedNumber !== 'undefined') return cachedNumber;

    const { currentNumber } = this;
    this.cache.set(str, currentNumber);
    this.currentNumber += 1;
    return currentNumber;
  }
}

export { UniqueIdGenerator };



---
File: /src/utils/utils.ts
---

import JSZip from 'jszip';
import { parseString } from 'whatsapp-chat-parser';
import { DateBounds, ExtractedFile, IndexedMessage } from '../types';
import { UniqueIdGenerator } from './unique-id-generator';

const getMimeType = (fileName: string) => {
  if (/\.jpe?g$/.test(fileName)) return 'image/jpeg';
  if (fileName.endsWith('.png')) return 'image/png';
  if (fileName.endsWith('.gif')) return 'image/gif';
  if (fileName.endsWith('.webp')) return 'image/webp';
  if (fileName.endsWith('.svg')) return 'image/svg+xml';

  if (fileName.endsWith('.mp4')) return 'video/mp4';
  if (fileName.endsWith('.webm')) return 'video/webm';

  if (fileName.endsWith('.mp3')) return 'audio/mpeg';
  if (fileName.endsWith('.m4a')) return 'audio/mp4';
  if (fileName.endsWith('.wav')) return 'audio/wav';
  if (fileName.endsWith('.opus')) return 'audio/ogg';

  return null;
};

const showError = (message: string, err?: Error) => {
  console.error(err || message); // eslint-disable-line no-console
  alert(message); // eslint-disable-line no-alert
};

const readChatFile = (zipData: JSZip) => {
  const chatFile = zipData.file('_chat.txt');

  if (chatFile) return chatFile.async('string');

  const chatFiles = zipData.file(/.*(?:chat|whatsapp).*\.txt$/i);

  if (!chatFiles.length) {
    return Promise.reject(new Error('No txt files found in archive'));
  }

  const chatFilesSorted = chatFiles.sort(
    (a, b) => a.name.length - b.name.length,
  );

  return chatFilesSorted[0].async('string');
};

const replaceEncryptionMessageAuthor = (messages: IndexedMessage[]) =>
  messages.map((message, i) => {
    if (i < 10 && message.message.includes('end-to-end')) {
      return { ...message, author: null };
    }
    return message;
  });

const extractFile = (file: FileReader['result']) => {
  if (!file) return null;
  if (typeof file === 'string') return file;

  const jszip = new JSZip();

  return jszip.loadAsync(file);
};

const fileToText = (file: ExtractedFile) => {
  if (!file) return Promise.resolve('');
  if (typeof file === 'string') return Promise.resolve(file);

  return readChatFile(file).catch((err: Error) => {
    // eslint-disable-next-line no-alert
    alert(err);
    return Promise.resolve('');
  });
};

function messagesFromFile(file: ExtractedFile, isAnonymous = false) {
  return fileToText(file).then(text => {
    const uniqueIdGenerator = new UniqueIdGenerator();
    const parsed = parseString(text, {
      parseAttachments: file instanceof JSZip,
    }).map(({ author, ...msg }, index) => ({
      ...msg,
      author:
        author && isAnonymous
          ? `User ${uniqueIdGenerator.getId(author)}`
          : author,
      index,
    }));

    return replaceEncryptionMessageAuthor(parsed);
  });
}

function participantsFromMessages(messages: IndexedMessage[]) {
  const set = new Set<string>();

  messages.forEach(m => {
    if (m.author) set.add(m.author);
  });

  return Array.from(set);
}

function getISODateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function extractStartEndDatesFromMessages(
  messages: IndexedMessage[],
): DateBounds {
  const start = messages[0]?.date ?? new Date();
  const end = messages.at(-1)?.date ?? new Date();

  return { start, end };
}

function filterMessagesByDate(
  messages: IndexedMessage[],
  startDate: Date,
  endDate: Date,
) {
  return messages.filter(
    message => message.date >= startDate && message.date <= endDate,
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export {
  getMimeType,
  showError,
  readChatFile,
  replaceEncryptionMessageAuthor,
  extractFile,
  fileToText,
  messagesFromFile,
  participantsFromMessages,
  getISODateString,
  extractStartEndDatesFromMessages,
  filterMessagesByDate,
  capitalize,
};



---
File: /src/utils/z-index.ts
---

const zIndex = {
  overlay: 10,
  sidebar: 20,
};

export { zIndex };



---
File: /src/App.tsx
---

import { useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import { showError } from './utils/utils';
import { rawFileAtom, messagesAtom } from './stores/global';
import Dropzone from './components/Dropzone/Dropzone';
import MessageViewer from './components/MessageViewer/MessageViewer';
import Sidebar from './components/Sidebar/Sidebar';
import * as S from './style';

import exampleChat from './assets/whatsapp-chat-parser-example.zip';

function App() {
  const messages = useAtomValue(messagesAtom);
  const setRawFile = useSetAtom(rawFileAtom);

  const processFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();

    reader.addEventListener('loadend', e => {
      if (e.target) {
        setRawFile(e.target.result);
      }
    });

    if (/^application\/(?:x-)?zip(?:-compressed)?$/.test(file.type)) {
      reader.readAsArrayBuffer(file);
    } else if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      showError(`File type ${file.type} not supported`);
    }
  };

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) =>
      document.documentElement.classList.toggle('ctrl-down', e.ctrlKey);

    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyHandler);

    return () => {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('keyup', keyHandler);
    };
  }, []);

  return (
    <>
      <S.GlobalStyles />
      <S.Container>
        <S.Header>
          <Dropzone onFileUpload={processFile} id="dropzone" />
          <span>OR</span>
          <a href={exampleChat} download>
            Download example chat
          </a>
        </S.Header>
        <MessageViewer />
        {messages.length > 0 && <Sidebar />}
      </S.Container>
    </>
  );
}

export default App;



---
File: /src/declarations.d.ts
---

declare module '*.png';
declare module '*.zip';



---
File: /src/index.tsx
---

import ReactDOM from 'react-dom/client';

import App from './App';

const rootDOM = document.getElementById('root');

if (rootDOM !== null) {
  const root = ReactDOM.createRoot(rootDOM);
  root.render(<App />);
}



---
File: /src/style.ts
---

import styled, { createGlobalStyle } from 'styled-components';

import { whatsappThemeColor } from './utils/colors';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
`;

const Header = styled.header`
  padding: 10px;
  display: flex;
  align-items: center;

  > *:first-child {
    flex: 1 1 auto;
  }

  @media (max-width: 699px) {
    flex-direction: column;

    > * + * {
      margin-top: 0.5rem;
    }
  }

  @media (min-width: 700px) {
    > * + * {
      margin-left: 1rem;
    }
  }
`;

const GlobalStyles = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  html {
    font-family: sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 
      'Segoe UI Symbol', 'Noto Color Emoji';
    box-sizing: border-box;
    
    @media (prefers-color-scheme: dark) {
      color-scheme: dark;
    }
  }

  body {
    margin: 0;
    color: #333;
  }

  a {
    text-decoration: none;
    color: ${whatsappThemeColor};
  }

  img,
  video,
  audio {
    max-width: 100%;
  }

  button {
    cursor: pointer;
  }

  html,
  body,
  #root {
    height: 100%;
  }

  @media (prefers-color-scheme: dark) {
    body {
      background-color: #262d31;
      color: #ccc;
    }
  }

  @media print {
    video, audio, ${Header}, .menu-open-button {
      display: none !important;
    }
  }
`;

export { GlobalStyles, Container, Header };



---
File: /src/types.ts
---

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



---
File: /index.html
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <link rel="manifest" href="/manifest.json" />
    <title>WhatsApp Chat Parser</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script src="/src/index.tsx" type="module"></script>
  </body>
</html>



---
File: /vite.config.ts
---

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.zip'],
  build: {
    outDir: 'build',
  },
  plugins: [react()],
  server: {
    open: true,
    port: 8000,
  },
});

``` i gitclone this project and running npm now. I want to edit a bit turning  by All chat thread messages (referred to as "cards") to have the same size. And placing all chat thread at centre. Not aligning to left or right side. Could you please guide me. But first, i am afraid i may break the code. Is it good to duplicate the folder of whatsapp parser viewer first then work on it then later npm install that file again. Would my apporach work to secure a version not polluted by beginner like me that can run, and also get a version i can play with altering it? no code first just chat. Keep answer short first for this security part
```
