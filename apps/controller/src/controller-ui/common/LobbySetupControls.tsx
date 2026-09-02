import { isLobbyFieldVisible, type AvailableGameDto } from "@open-party-lab/protocol";

type LobbyField = NonNullable<AvailableGameDto["lobbySetup"]>["fields"][number];
type SettingsMap = Record<string, string | number | boolean>;

export interface LobbySetupControlsProps {
  game: AvailableGameDto;
  settings: SettingsMap;
  /** Frozen while a round runs, mirroring the shared screen. */
  disabled: boolean;
  onHostAction: (gameId: string, action: unknown) => void;
}

/**
 * The selected game's lobby settings, on the phone.
 *
 * Host control used to hand over the room but not the game: whoever held it
 * could pick MinionsTD and start it, yet the map, the starting lives, or the
 * card-table ruleset could still only be set on the shared screen — so taking
 * over meant giving up exactly the choices that matter before a round.
 *
 * The fields come from the game's manifest and the values from the room, so
 * this needs no per-game knowledge and covers every game that declares a lobby
 * setup. It emits the same `configure-lobby` action the screen emits, which is
 * what keeps the two surfaces from drifting apart.
 */
const labelStyle = {
  margin: 0,
  fontSize: ".72rem",
  letterSpacing: "1.4px",
  textTransform: "uppercase",
  color: "var(--muted)"
} as const;

const hintStyle = {
  margin: 0,
  fontSize: ".78rem",
  lineHeight: 1.45,
  color: "var(--muted)"
} as const;

const optionBase = {
  minHeight: 46,
  padding: "8px 14px",
  borderRadius: "var(--radius-md)",
  textAlign: "left",
  lineHeight: 1.3
} as const;

const stepperButtonStyle = {
  width: 52,
  minHeight: 46,
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--line)",
  background: "var(--surface-muted)",
  color: "var(--ink)",
  fontSize: "1.35rem",
  lineHeight: 1
} as const;

function SelectField({
  game,
  field,
  value,
  disabled,
  onHostAction
}: {
  game: AvailableGameDto;
  field: LobbyField & { kind: "select" };
  value: unknown;
  disabled: boolean;
  onHostAction: LobbySetupControlsProps["onHostAction"];
}) {
  const current = String(value);

  return (
    <div style={{ display: "grid", gap: 7 }}>
      <p style={labelStyle}>{field.label}</p>
      <div style={{ display: "grid", gap: 6 }}>
        {field.options.map((option) => {
          const selected = option.id === current;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() =>
                onHostAction(game.id, {
                  type: "configure-lobby",
                  [field.actionKey ?? field.id]: option.id
                })
              }
              style={{
                ...optionBase,
                border: selected ? "2px solid var(--accent)" : "1px solid var(--line)",
                background: selected ? "var(--accent-soft)" : "var(--surface-muted)",
                color: "var(--ink)",
                fontWeight: selected ? 700 : 400,
                opacity: disabled ? 0.5 : 1
              }}
            >
              <span style={{ display: "block" }}>{option.label}</span>
              {option.description ? (
                <span style={{ display: "block", fontSize: ".76rem", color: "var(--muted)" }}>
                  {option.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {field.description ? <p style={hintStyle}>{field.description}</p> : null}
    </div>
  );
}

function NumberField({
  game,
  field,
  value,
  disabled,
  onHostAction
}: {
  game: AvailableGameDto;
  field: LobbyField & { kind: "number" };
  value: unknown;
  disabled: boolean;
  onHostAction: LobbySetupControlsProps["onHostAction"];
}) {
  const numeric = typeof value === "number" ? value : Number(value);
  const current = Number.isFinite(numeric) ? numeric : field.defaultValue;

  const step = (delta: number) => {
    const next = Math.max(field.min, Math.min(field.max, current + delta));

    onHostAction(game.id, {
      type: "configure-lobby",
      [field.actionKey ?? field.id]: next
    });
  };

  return (
    <div style={{ display: "grid", gap: 7 }}>
      <p style={labelStyle}>{field.label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          aria-label={`${field.label} verringern`}
          disabled={disabled || current - field.step < field.min}
          onClick={() => step(-field.step)}
          style={stepperButtonStyle}
        >
          −
        </button>
        <output
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "1.15rem"
          }}
        >
          {current}
        </output>
        <button
          type="button"
          aria-label={`${field.label} erhoehen`}
          disabled={disabled || current + field.step > field.max}
          onClick={() => step(field.step)}
          style={stepperButtonStyle}
        >
          +
        </button>
      </div>
      {field.description ? <p style={hintStyle}>{field.description}</p> : null}
    </div>
  );
}

export function LobbySetupControls({
  game,
  settings,
  disabled,
  onHostAction
}: LobbySetupControlsProps) {
  const setup = game.lobbySetup;

  if (!setup || setup.fields.length === 0) {
    return null;
  }

  const confirmation = setup.confirmation;
  const confirmed = confirmation ? settings[confirmation.settingKey] === true : false;
  // Dieselbe Regel wie auf dem grossen Bildschirm: Was gerade nichts bewirkt,
  // wird ausgeblendet statt ausgegraut.
  const visibleFields = setup.fields.filter((field) =>
    isLobbyFieldVisible(field, setup.fields, settings)
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {setup.description ? <p style={hintStyle}>{setup.description}</p> : null}

      {visibleFields.map((field) => {
        const value = settings[field.settingKey ?? field.id] ?? field.defaultValue;

        return field.kind === "select" ? (
          <SelectField
            key={field.id}
            game={game}
            field={field}
            value={value}
            disabled={disabled}
            onHostAction={onHostAction}
          />
        ) : (
          <NumberField
            key={field.id}
            game={game}
            field={field}
            value={value}
            disabled={disabled}
            onHostAction={onHostAction}
          />
        );
      })}

      {confirmation ? (
        <div style={{ display: "grid", gap: 7 }}>
          <button
            type="button"
            aria-pressed={confirmed}
            disabled={disabled}
            onClick={() => onHostAction(game.id, { type: confirmation.actionType })}
            style={{
              ...optionBase,
              border: confirmed ? "2px solid var(--accent)" : "1px solid var(--line)",
              background: confirmed ? "var(--accent-soft)" : "var(--surface-muted)",
              color: "var(--ink)",
              fontWeight: confirmed ? 700 : 400,
              opacity: disabled ? 0.5 : 1,
              textAlign: "center"
            }}
          >
            {confirmation.label ?? "OK"}
          </button>
          {confirmation.description ? <p style={hintStyle}>{confirmation.description}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
