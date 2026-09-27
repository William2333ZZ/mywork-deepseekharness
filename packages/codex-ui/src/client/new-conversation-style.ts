/** 新建页底部输入布局；保留宿主节点、插槽与 active 会话底部信息。 */
export const NEW_CONVERSATION_STYLE = `
[data-phase=hero]:has([data-conversation-scroll]){container:dcu-new-conversation / inline-size}
[data-phase=hero] [data-conversation-scroll][class]{--dsh-composer-side-clearance:16px;justify-content:flex-start;scrollbar-gutter:stable both-edges}
[data-phase=hero] [data-composer-seat]{flex:1 0 auto;min-height:100%}
[data-phase=hero] [data-composer-seat]>:has([class*="_composerHero"]){display:flex;flex:1;flex-direction:column}
[data-phase=hero] [class*="_composerHero"]{box-sizing:border-box;flex:1;width:100%;max-width:none;min-width:0;margin-inline:auto;gap:0;padding-bottom:32px}
[data-phase=hero] [class*="_composerHero"]>:first-child{box-sizing:border-box;flex:1;width:100%;max-width:768px;align-self:center;height:auto;min-height:340px;align-items:center;padding:32px 28px}
[data-phase=hero] [class*="_composerHero"]>:first-child>[class$="_stack"]{width:100%;max-width:none;min-width:0;align-items:center;gap:32px}
[data-phase=hero] [class*="_composerHero"] [class$="_headline"]{grid-template-columns:46px auto auto;font-size:34px;line-height:44px}
[data-phase=hero] [class*="_composerHero"] [class$="_fishHitbox"]{width:46px;height:46px}
[data-phase=hero] [class*="_composerHero"] [class$="_fishHitbox"]>svg{width:46px;height:auto}
[data-phase=hero] [class*="_heroWorkspaceRow"]{box-sizing:border-box;flex:none;width:min(calc(var(--dsh-composer-card-max-width) + 2 * var(--dsh-composer-side-clearance) - 56px),calc(100% - 56px));align-self:center;justify-content:flex-start;flex-wrap:wrap;gap:8px;min-height:48px;margin:0 28px -10px;padding:6px 12px 16px;border-radius:18px 18px 0 0;background:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,var(--dsw-alias-bg-base))}
[data-phase=hero] [class*="_heroWorkspaceRow"]>[class$="_workspace"]{min-width:0;max-width:100%;font-weight:400}
.dcu-home-suggestions{width:100%;color:var(--dsw-alias-label-primary);font:13px/20px var(--dsw-font-family,system-ui)}
.dcu-home-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.dcu-home-card{appearance:none;display:flex;flex-direction:column;justify-content:space-between;gap:22px;min-width:0;min-height:106px;padding:16px;border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent);border-radius:20px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background-color 150ms,border-color 150ms}
.dcu-home-card:hover,.dcu-home-card[aria-pressed=true]{background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-label-primary) 20%,transparent)}
.dcu-home-card svg{width:16px;height:16px;flex:none;color:var(--dcu-home-icon)}
.dcu-home-card:focus-visible,.dcu-home-task:focus-visible{outline:2px solid var(--dsw-alias-label-primary);outline-offset:3px}
.dcu-home-details,.dcu-home-status{display:grid}
.dcu-home-suggestions[data-has-draft=true]{visibility:hidden;pointer-events:none}
.dcu-home-tasks{grid-area:1/1;display:flex;flex-wrap:wrap;align-content:start;gap:8px;margin-top:16px}
.dcu-home-details>[data-active=false],.dcu-home-status>[data-active=false]{visibility:hidden;pointer-events:none}
.dcu-home-task{appearance:none;border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary) 12%,transparent);border-radius:10px;padding:8px 12px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dcu-home-task:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent)}
.dcu-home-hint{grid-area:1/1;margin:12px 0 0;color:var(--dsw-alias-label-secondary)}
@container dcu-new-conversation (width < 640px){
  .dcu-home-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
  [data-phase=hero] [class*="_composerHero"]>:first-child{padding:32px 24px;min-height:420px}
}
@media(prefers-reduced-motion:reduce){.dcu-home-card{transition:none}}
/* Digital Oracle Work edition: no slogan hero, no workspace / access-mode pickers in the hero, five question cards. */
body[data-mywork-edition=oracle] [data-phase=hero] [class*="_composerHero"] [class$="_headline"],body[data-mywork-edition=oracle] [data-phase=hero] [class*="_titleGroup"]{display:none}
body[data-mywork-edition=oracle] [data-phase=hero] [class*="_heroWorkspaceRow"]{display:none}
/* one conversation entry: the 提问 item; dsh's own "back to conversation" button is redundant in the edition */
body[data-mywork-edition=oracle] .dcu-menu>.dcu-global-panel:first-child,body[data-mywork-edition=oracle] .dcu-compact-nav>.dcu-global-panel:first-child{display:none}
body[data-mywork-edition=oracle] [data-composer-card] button[aria-label^="访问模式"],body[data-mywork-edition=oracle] [data-composer-card] button[aria-label^="Access mode"]{display:none}
.dcu-home-edition{display:flex;flex-direction:column;gap:16px}
body[data-mywork-edition=oracle] [data-phase=hero] [class*="_composerHero"]>:first-child{max-width:880px}
.dcu-home-strip{appearance:none;display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;width:100%;padding:8px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--mwc-radius,6px);background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:left}
.dcu-home-strip:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dcu-home-strip-item{display:inline-flex;align-items:baseline;gap:6px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dcu-home-strip-value,.dcu-home-strip-delta{font-family:var(--dsw-font-mono,ui-monospace,monospace);font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}
.dcu-home-strip-delta{font-size:11.5px}
.dcu-home-strip-delta.up{color:var(--dsw-alias-state-error-primary)}.dcu-home-strip-delta.down{color:var(--dsw-alias-state-success-primary)}
.dcu-home-strip-open{margin-left:auto;font-size:12px;color:var(--dsw-alias-brand-primary)}
.dcu-home-digest{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px 24px;width:100%;text-align:left}
.dcu-home-digest-head{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;color:var(--dsw-alias-label-secondary);padding-bottom:6px;border-bottom:1px solid var(--dsw-alias-border-l2);margin-bottom:4px}
.dcu-home-link{appearance:none;border:0;background:transparent;padding:0;font:inherit;font-size:12px;color:var(--dsw-alias-brand-primary);cursor:pointer}
.dcu-home-digest-empty{margin:8px 0;font-size:12.5px;color:var(--dsw-alias-label-tertiary)}
.dcu-home-table{width:100%;border-collapse:collapse;font-size:12.5px}
.dcu-home-table td{padding:5px 6px 5px 0;border-bottom:1px solid var(--dsw-alias-border-l1,var(--dsw-alias-border-l2));vertical-align:middle}
.dcu-home-td-label{color:var(--dsw-alias-label-primary)}
.dcu-home-td-sub{display:block;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.dcu-home-td-num{text-align:right;font-family:var(--dsw-font-mono,ui-monospace,monospace);font-variant-numeric:tabular-nums;white-space:nowrap}
.dcu-home-td-num.up{color:var(--dsw-alias-state-error-primary)}.dcu-home-td-num.down{color:var(--dsw-alias-state-success-primary)}
.dcu-home-td-act{text-align:right;width:1%}
.dcu-home-chip{appearance:none;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--mwc-radius,6px);padding:4px 10px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
.dcu-home-chip:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.dcu-home-chip-primary{border-color:transparent;background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary));color:var(--dsw-alias-label-primary-foreground,#fff);font-weight:600}
.dcu-home-chip-primary:hover{color:var(--dsw-alias-label-primary-foreground,#fff);background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary))}
.dcu-home-report{appearance:none;display:grid;grid-template-columns:52px 1fr;gap:10px;align-items:start;width:100%;padding:6px 0;border:0;border-bottom:1px solid var(--dsw-alias-border-l1,var(--dsw-alias-border-l2));background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dcu-home-report-p{font-family:var(--dsw-font-mono,ui-monospace,monospace);font-size:16px;font-weight:500;line-height:1.2}
.dcu-home-report-t{font-size:12.5px;line-height:1.35;color:var(--dsw-alias-label-primary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.dcu-home-changes{margin:0;padding:0;list-style:none;font-size:12.5px}
.dcu-home-changes li{display:flex;justify-content:space-between;gap:10px;padding:4px 0;border-bottom:1px solid var(--dsw-alias-border-l1,var(--dsw-alias-border-l2))}
.dcu-home-templates{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
@container dcu-new-conversation (width < 640px){.dcu-home-digest{grid-template-columns:1fr}}
.dcu-home-edition-head{display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center}
.dcu-home-edition-title{margin:0;font-size:22px;line-height:28px;font-weight:600;letter-spacing:-.01em;color:var(--dsw-alias-label-primary)}
.dcu-home-edition-sub{margin:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary);max-width:44ch}
.dcu-home-cards-5{grid-template-columns:repeat(5,minmax(0,1fr))}
.dcu-home-cards-5 .dcu-home-card{min-height:88px;gap:14px}
@container dcu-new-conversation (width < 640px){.dcu-home-cards-5{grid-template-columns:repeat(2,minmax(0,1fr))}}
`
