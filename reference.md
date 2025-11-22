# Here is ChatGPT's code, and Orbitar's code for reference on where everything is

```
<div class=""><div class="orbitar-panel">
    <div class="orbitar-chatgpt-bar" id="orbitar-bar">
      <div class="orbitar-panel-glow"></div>

      <div class="orbitar-chatgpt-left">
        <div class="orbitar-plan-pill">
          <span id="orbitar-plan-badge">Pro</span>
        </div>

        <div class="orbitar-pill-wrap">
          <div class="orbitar-pill orbitar-category-pill">
             <div class="orbitar-pill-content">
                <span class="orbitar-pill-label">Category</span>
                <span class="orbitar-pill-value" id="orbitar-category-value">General</span>
             </div>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="orbitar-pill-chevron"><path d="m6 9 6 6 6-6"></path></svg>
          </div>
          <select class="orbitar-select-native" id="orbitar-category" title="Category"><option value="coding">Coding</option><option value="writing">Writing</option><option value="research">Research</option><option value="planning">Planning</option><option value="communication">Communication</option><option value="creative">Creative</option><option value="general">General</option></select>
        </div>

        <div class="orbitar-pill-wrap">
          <div class="orbitar-pill orbitar-template-pill">
             <div class="orbitar-pill-content">
                <span class="orbitar-pill-label">Template</span>
                <span class="orbitar-pill-value" id="orbitar-template-value">General prompt</span>
             </div>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="orbitar-pill-chevron"><path d="m6 9 6 6 6-6"></path></svg>
          </div>
          <select class="orbitar-select-native" id="orbitar-template" title="Template"><option value="general_general">General prompt</option></select>
        </div>

        <span class="orbitar-suggestion-text" id="orbitar-suggestion" style="display:none;"></span>
      </div>

      <div class="orbitar-chatgpt-right">
        <button class="orbitar-refine-button" id="refine-btn">
           <div class="orbitar-refine-shine"></div>
           <span style="position:relative; z-index:10;">Refine</span>
        </button>
        <button class="orbitar-close-button" id="close-btn" aria-label="Close Orbitar panel">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
        </button>
      </div>
    </div>

    <span class="orbitar-error" id="error-msg"></span>
  </div><div class="bg-token-bg-primary cursor-text overflow-clip bg-clip-padding p-2.5 contain-inline-size dark:bg-[#303030] grid grid-cols-[auto_1fr_auto] [grid-template-areas:'header_header_header'_'leading_primary_trailing'_'._footer_.'] group-data-expanded/composer:[grid-template-areas:'header_header_header'_'primary_primary_primary'_'leading_footer_trailing'] shadow-short" style="border-radius: 28px; transform: none; transform-origin: 50% 50% 0px;"><div class="-my-2.5 flex min-h-14 items-center overflow-x-hidden px-1.5 [grid-area:primary] group-data-expanded/composer:mb-0 group-data-expanded/composer:px-2.5" style="transform: none; transform-origin: 50% 50% 0px;"><div class="_prosemirror-parent_1dsxi_2 text-token-text-primary max-h-[max(30svh,5rem)] max-h-52 flex-1 overflow-auto [scrollbar-width:thin] default-browser vertical-scroll-fade-mask" style="position: relative;"><textarea class="_fallbackTextarea_1dsxi_2" name="prompt-textarea" autofocus="" placeholder="Ask anything" data-virtualkeyboard="true" style="display: none;"></textarea><script nonce="">window.__oai_logHTML?window.__oai_logHTML():window.__oai_SSR_HTML=window.__oai_SSR_HTML||Date.now();requestAnimationFrame((function(){window.__oai_logTTI?window.__oai_logTTI():window.__oai_SSR_TTI=window.__oai_SSR_TTI||Date.now()}))</script><div contenteditable="true" translate="no" class="ProseMirror" id="prompt-textarea" data-virtualkeyboard="true"><p>create a feature for the website that allows a user to login</p></div><div class="orbitar-integrated-actions"><button type="button" class="orbitar-chatgpt-icon composer-btn" title="Orbitar – Refine prompt" aria-label="Open Orbitar"><div class="orbitar-icon-glow"></div><svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2" fill="currentColor" class="group-hover:opacity-100 transition-opacity"></circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" opacity="0.8" class="group-hover:opacity-100 transition-opacity"></circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" opacity="0.5" transform="rotate(60 12 12)" class="group-hover:opacity-70 transition-opacity"></circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" opacity="0.5" transform="rotate(120 12 12)" class="group-hover:opacity-70 transition-opacity"></circle>
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" stroke-width="1" opacity="0.6" class="group-hover:opacity-80 transition-opacity"></ellipse>
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" stroke-width="1" opacity="0.6" class="group-hover:opacity-80 transition-opacity"></ellipse>
      <ellipse cx="12" cy="12" rx="8" ry="5" stroke="currentColor" stroke-width="0.8" opacity="0.4" transform="rotate(45 12 12)" class="group-hover:opacity-60 transition-opacity"></ellipse>
      <ellipse cx="12" cy="12" rx="8" ry="5" stroke="currentColor" stroke-width="0.8" opacity="0.4" transform="rotate(-45 12 12)" class="group-hover:opacity-60 transition-opacity"></ellipse>
    </svg></button></div></div></div><div class="[grid-area:leading]" style="transform: none; transform-origin: 50% 50% 0px;"><span class="flex" data-state="closed"><button type="button" class="composer-btn" data-testid="composer-plus-btn" aria-label="Add files and more" id="composer-plus-btn" aria-haspopup="menu" aria-expanded="false" data-state="closed"><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon"><path d="M9.33496 16.5V10.665H3.5C3.13273 10.665 2.83496 10.3673 2.83496 10C2.83496 9.63273 3.13273 9.33496 3.5 9.33496H9.33496V3.5C9.33496 3.13273 9.63273 2.83496 10 2.83496C10.3673 2.83496 10.665 3.13273 10.665 3.5V9.33496H16.5L16.6338 9.34863C16.9369 9.41057 17.165 9.67857 17.165 10C17.165 10.3214 16.9369 10.5894 16.6338 10.6514L16.5 10.665H10.665V16.5C10.665 16.8673 10.3673 17.165 10 17.165C9.63273 17.165 9.33496 16.8673 9.33496 16.5Z"></path></svg></button></span></div><div data-testid="composer-footer-actions" class="-m-1 max-w-full overflow-x-auto p-1 [grid-area:footer] [scrollbar-width:none]" style="transform: none; transform-origin: 50% 50% 0px;"><div class="flex min-w-fit items-center cant-hover:px-1.5 cant-hover:gap-1.5"><div><div class="__composer-pill-composite group relative"><button type="button" class="__composer-pill-remove" aria-label="Extended thinking, click to remove"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon-sm" inert=""><path d="M11.1152 3.91503C11.3868 3.73594 11.756 3.7658 11.9951 4.00488C12.2341 4.24395 12.264 4.61309 12.0849 4.88476L11.9951 4.99511L8.99018 7.99999L11.9951 11.0049L12.0849 11.1152C12.264 11.3869 12.2341 11.756 11.9951 11.9951C11.756 12.2342 11.3868 12.2641 11.1152 12.085L11.0048 11.9951L7.99995 8.99023L4.99506 11.9951C4.7217 12.2685 4.2782 12.2685 4.00483 11.9951C3.73146 11.7217 3.73146 11.2782 4.00483 11.0049L7.00971 7.99999L4.00483 4.99511L3.91499 4.88476C3.73589 4.61309 3.76575 4.24395 4.00483 4.00488C4.24391 3.7658 4.61305 3.73594 4.88471 3.91503L4.99506 4.00488L7.99995 7.00976L11.0048 4.00488L11.1152 3.91503Z"></path></svg></button><button type="button" id="radix-_r_2b_" aria-haspopup="menu" aria-expanded="false" data-state="closed" class="__composer-pill group/pill"><div class="__composer-pill-icon" inert=""><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.585 10C16.585 6.3632 13.6368 3.41504 10 3.41504C6.3632 3.41504 3.41504 6.3632 3.41504 10C3.41504 13.6368 6.3632 16.585 10 16.585C13.6368 16.585 16.585 13.6368 16.585 10ZM17.915 10C17.915 14.3713 14.3713 17.915 10 17.915C5.62867 17.915 2.08496 14.3713 2.08496 10C2.08496 5.62867 5.62867 2.08496 10 2.08496C14.3713 2.08496 17.915 5.62867 17.915 10Z"></path><path d="M10.0002 8.5C10.8285 8.50022 11.5002 9.17171 11.5002 10C11.5002 10.8283 10.8285 11.4998 10.0002 11.5C8.50014 11.4999 5.00025 10.5 5.00025 10C5.00025 9.50002 8.50014 8.50009 10.0002 8.5Z"></path><path d="M12.0833 0.00488281C12.4504 0.00505872 12.7483 0.302761 12.7483 0.669922C12.7483 1.03708 12.4504 1.33479 12.0833 1.33496H7.91626C7.54922 1.3347 7.25122 1.03703 7.25122 0.669922C7.25122 0.302814 7.54922 0.00514505 7.91626 0.00488281H12.0833Z"></path></svg></div><span class="max-w-40 truncate [[data-collapse-labels]_&amp;]:sr-only">Extended thinking</span><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon-sm -me-0.5 h-3.5 w-3.5" inert=""><path d="M12.1338 5.94433C12.3919 5.77382 12.7434 5.80202 12.9707 6.02929C13.1979 6.25656 13.2261 6.60807 13.0556 6.8662L12.9707 6.9707L8.47067 11.4707C8.21097 11.7304 7.78896 11.7304 7.52926 11.4707L3.02926 6.9707L2.9443 6.8662C2.77379 6.60807 2.80199 6.25656 3.02926 6.02929C3.25653 5.80202 3.60804 5.77382 3.86617 5.94433L3.97067 6.02929L7.99996 10.0586L12.0293 6.02929L12.1338 5.94433Z"></path></svg></button></div></div></div></div><div class="flex items-center gap-2 [grid-area:trailing]" style="transform: none; transform-origin: 50% 50% 0px;"><div class="ms-auto flex items-center gap-1.5"><span class="" data-state="closed"><button aria-label="Dictate button" type="button" class="composer-btn"><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="" class="icon" font-size="inherit"><path d="M15.7806 10.1963C16.1326 10.3011 16.3336 10.6714 16.2288 11.0234L16.1487 11.2725C15.3429 13.6262 13.2236 15.3697 10.6644 15.6299L10.6653 16.835H12.0833L12.2171 16.8486C12.5202 16.9106 12.7484 17.1786 12.7484 17.5C12.7484 17.8214 12.5202 18.0894 12.2171 18.1514L12.0833 18.165H7.91632C7.5492 18.1649 7.25128 17.8672 7.25128 17.5C7.25128 17.1328 7.5492 16.8351 7.91632 16.835H9.33527L9.33429 15.6299C6.775 15.3697 4.6558 13.6262 3.84992 11.2725L3.76984 11.0234L3.74445 10.8906C3.71751 10.5825 3.91011 10.2879 4.21808 10.1963C4.52615 10.1047 4.84769 10.2466 4.99347 10.5195L5.04523 10.6436L5.10871 10.8418C5.8047 12.8745 7.73211 14.335 9.99933 14.335C12.3396 14.3349 14.3179 12.7789 14.9534 10.6436L15.0052 10.5195C15.151 10.2466 15.4725 10.1046 15.7806 10.1963ZM12.2513 5.41699C12.2513 4.17354 11.2437 3.16521 10.0003 3.16504C8.75675 3.16504 7.74835 4.17343 7.74835 5.41699V9.16699C7.74853 10.4104 8.75685 11.418 10.0003 11.418C11.2436 11.4178 12.2511 10.4103 12.2513 9.16699V5.41699ZM13.5814 9.16699C13.5812 11.1448 11.9781 12.7479 10.0003 12.748C8.02232 12.748 6.41845 11.1449 6.41828 9.16699V5.41699C6.41828 3.43889 8.02221 1.83496 10.0003 1.83496C11.9783 1.83514 13.5814 3.439 13.5814 5.41699V9.16699Z"></path></svg></button></span><button id="composer-submit-button" aria-label="Send prompt" data-testid="send-button" class="composer-submit-btn composer-submit-button-color h-9 w-9"><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon"><path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z"></path></svg></button></div></div></div></div>
```

# Here is where the Orbitar Icon is located:

````
<div class="_prosemirror-parent_1dsxi_2 text-token-text-primary max-h-[max(30svh,5rem)] max-h-52 flex-1 overflow-auto [scrollbar-width:thin] default-browser vertical-scroll-fade-mask" style="position: relative;"><textarea class="_fallbackTextarea_1dsxi_2" name="prompt-textarea" autofocus="" placeholder="Ask anything" data-virtualkeyboard="true" style="display: none;"></textarea><script nonce="">window.__oai_logHTML?window.__oai_logHTML():window.__oai_SSR_HTML=window.__oai_SSR_HTML||Date.now();requestAnimationFrame((function(){window.__oai_logTTI?window.__oai_logTTI():window.__oai_SSR_TTI=window.__oai_SSR_TTI||Date.now()}))</script><div contenteditable="true" translate="no" class="ProseMirror" id="prompt-textarea" data-virtualkeyboard="true"><p>create a feature for the website that allows a user to login</p></div><div class="orbitar-integrated-actions"><button type="button" class="orbitar-chatgpt-icon composer-btn" title="Orbitar – Refine prompt" aria-label="Open Orbitar"><div class="orbitar-icon-glow"></div><svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2" fill="currentColor" class="group-hover:opacity-100 transition-opacity"></circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" opacity="0.8" class="group-hover:opacity-100 transition-opacity"></circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" opacity="0.5" transform="rotate(60 12 12)" class="group-hover:opacity-70 transition-opacity"></circle>
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1" opacity="0.5" transform="rotate(120 12 12)" class="group-hover:opacity-70 transition-opacity"></circle>
      <ellipse cx="12" cy="12" rx="9" ry="4" stroke="currentColor" stroke-width="1" opacity="0.6" class="group-hover:opacity-80 transition-opacity"></ellipse>
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke="currentColor" stroke-width="1" opacity="0.6" class="group-hover:opacity-80 transition-opacity"></ellipse>
      <ellipse cx="12" cy="12" rx="8" ry="5" stroke="currentColor" stroke-width="0.8" opacity="0.4" transform="rotate(45 12 12)" class="group-hover:opacity-60 transition-opacity"></ellipse>
      <ellipse cx="12" cy="12" rx="8" ry="5" stroke="currentColor" stroke-width="0.8" opacity="0.4" transform="rotate(-45 12 12)" class="group-hover:opacity-60 transition-opacity"></ellipse>
    </svg></button></div></div>

    ```
````
