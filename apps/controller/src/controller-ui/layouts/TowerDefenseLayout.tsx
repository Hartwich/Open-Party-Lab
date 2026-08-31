import { useEffect, useMemo, useRef, useState } from "react";
import { useHaptics } from "../../hooks/useHaptics.js";
import type {
  TowerDefenseCatalogEnemyModel,
  TowerDefenseCatalogTowerModel,
  TowerDefenseLayoutModel,
  TowerDefenseMapModel,
  TowerDefenseTowerModel
} from "./models.js";

interface TowerDefenseLayoutProps {
  model: TowerDefenseLayoutModel;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function resolveCellKey(col: number, row: number): string {
  return `${col}:${row}`;
}

function resolveTowerStatusText(tower: TowerDefenseTowerModel | null, en: boolean): string {
  if (!tower) {
    return en ? "Free build slot" : "Freier Bauplatz";
  }

  return `Lv.${tower.level} | ${formatNumber(tower.damage)} DMG | ${formatNumber(tower.range)} Range`;
}

function formatLevelSeries(values: number[], suffix = ""): string {
  const joined = values.map((value) => formatNumber(value)).join(" / ");
  return suffix ? `${joined}${suffix}` : joined;
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        padding: 8,
        borderRadius: 14,
        border: "1px solid color-mix(in srgb, var(--accent) 16%, transparent)",
        background: "color-mix(in srgb, var(--accent-soft) 28%, transparent)"
      }}
    >
      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{label}</div>
      <strong style={{ fontSize: "1rem" }}>{value}</strong>
    </div>
  );
}

function BuildBlueprint({
  map,
  selectedSlotId,
  rangeOverlay,
  disabled,
  accentColor,
  en,
  onSelect
}: {
  map: TowerDefenseMapModel;
  selectedSlotId: string | null;
  rangeOverlay?: {
    col: number;
    row: number;
    range: number;
    color: string;
  } | null;
  disabled: boolean;
  accentColor?: string;
  en: boolean;
  onSelect: (slotId: string) => void;
}) {
  const pathCells = new Set(map.pathCells.map((cell) => resolveCellKey(cell.col, cell.row)));
  const slotsByCell = new Map(
    map.buildSlots.map((slot) => [resolveCellKey(slot.col, slot.row), slot] as const)
  );
  const cells: React.ReactNode[] = [];

  for (let row = 0; row < map.rows; row += 1) {
    for (let col = 0; col < map.cols; col += 1) {
      const key = resolveCellKey(col, row);
      const slot = slotsByCell.get(key) ?? null;
      const isPath = pathCells.has(key);
      const isSelected = slot?.id === selectedSlotId;

      if (slot) {
        cells.push(
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(slot.id)}
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              borderRadius: 6,
              border: isSelected
                ? `2px solid ${accentColor ?? "var(--accent)"}`
                : slot.tower
                  ? `1px solid ${slot.tower.color}66`
                  : "1px solid color-mix(in srgb, var(--accent) 55%, transparent)",
              background: slot.tower
                ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--surface) 92%, transparent))"
                : "linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 62%, transparent), color-mix(in srgb, var(--surface) 88%, transparent))",
              boxShadow: isSelected ? `0 0 0 2px ${accentColor ?? "var(--accent)"}22` : "none",
              color: "var(--text-main)",
              padding: slot.tower ? 0 : 3,
              display: "grid",
              placeItems: "center",
              opacity: disabled ? 0.55 : 1,
              overflow: "hidden"
            }}
          >
            <div style={{ display: "grid", justifyItems: "center" }}>
              <div
                style={{
                  width: slot.tower ? "100%" : "62%",
                  aspectRatio: "1 / 1",
                  borderRadius: slot.tower ? 4 : 4,
                  background: slot.tower ? "transparent" : "color-mix(in srgb, var(--ink-soft) 8%, transparent)",
                  border: slot.tower ? "none" : "1px dashed color-mix(in srgb, var(--muted) 48%, transparent)",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden"
                }}
              >
                {slot.tower?.iconPath ? (
                  <img
                    src={slot.tower.iconPath}
                    alt=""
                    style={{
                      width: "116%",
                      height: "116%",
                      objectFit: "contain",
                      display: "block",
                      transform: "translateY(-6%)"
                    }}
                  />
                ) : null}
              </div>
            </div>
          </button>
        );

        continue;
      }

      cells.push(
        <div
          key={key}
          style={{
            position: "relative",
            aspectRatio: "1 / 1",
            borderRadius: 4,
            border: "1px solid color-mix(in srgb, var(--muted) 8%, transparent)",
            background: isPath
              ? "linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 98%, transparent), color-mix(in srgb, var(--accent-strong) 92%, transparent))"
              : "color-mix(in srgb, var(--surface) 74%, transparent)",
            overflow: "hidden"
          }}
        >
          {isPath ? (
            <div
              style={{
                position: "absolute",
                inset: "22% 10%",
                borderRadius: 3,
                background: "color-mix(in srgb, var(--accent) 18%, transparent)"
              }}
            />
          ) : null}
        </div>
      );
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 7,
        padding: 7,
        borderRadius: 14,
        border: "1px solid var(--panel-border)",
        background: "color-mix(in srgb, var(--surface) 58%, transparent)"
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, color: "var(--text-muted)", fontSize: "0.78rem" }}>
        <span>{en ? "Path" : "Pfad"}</span>
        <span>{en ? "Free Slot" : "Freier Slot"}</span>
        <span>Tower</span>
      </div>
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(1, map.cols)}, minmax(0, 1fr))`,
          gap: 4,
          padding: 5,
          borderRadius: 10,
          background: "linear-gradient(180deg, color-mix(in srgb, var(--paper) 92%, transparent), color-mix(in srgb, var(--surface) 86%, transparent))",
          aspectRatio: `${Math.max(1, map.cols)} / ${Math.max(1, map.rows)}`
        }}
      >
        {rangeOverlay ? (
          <div
            style={{
              position: "absolute",
              inset: 5,
              zIndex: 4,
              pointerEvents: "none",
              overflow: "hidden",
              borderRadius: 8
            }}
          >
            <div
              style={{
                position: "absolute",
                left: `${((rangeOverlay.col + 0.5 - rangeOverlay.range) / map.cols) * 100}%`,
                top: `${((rangeOverlay.row + 0.5 - rangeOverlay.range) / map.rows) * 100}%`,
                width: `${(rangeOverlay.range * 2 / map.cols) * 100}%`,
                height: `${(rangeOverlay.range * 2 / map.rows) * 100}%`,
                borderRadius: "50%",
                border: `2px solid ${rangeOverlay.color}`,
                background: `${rangeOverlay.color}1f`,
                boxShadow: `0 0 0 1px ${rangeOverlay.color}22, inset 0 0 18px ${rangeOverlay.color}16`
              }}
            />
          </div>
        ) : null}
        {cells}
      </div>
    </div>
  );
}

function TowerCard({
  tower,
  selected,
  disabled,
  onPick
}: {
  tower: TowerDefenseCatalogTowerModel;
  selected: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      style={{
        minHeight: 78,
        borderRadius: 14,
        border: selected ? `2px solid ${tower.color}` : "1px solid var(--panel-border)",
        background: selected
          ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 16%, transparent), color-mix(in srgb, var(--surface) 84%, transparent))"
          : "color-mix(in srgb, var(--surface) 62%, transparent)",
        color: "var(--text-main)",
        padding: 6,
        textAlign: "left",
        opacity: disabled ? 0.55 : 1,
        display: "grid",
        gap: 2
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 42,
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid color-mix(in srgb, var(--muted) 16%, transparent)",
          background: `radial-gradient(circle at 30% 20%, ${tower.color}2E, color-mix(in srgb, var(--surface) 96%, transparent))`,
          display: "grid",
          placeItems: "center"
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 6,
            left: 3,
            zIndex: 1,
            padding: "2px 6px",
            borderRadius: 999,
            background: "color-mix(in srgb, var(--paper) 82%, transparent)",
            border: `1px solid ${tower.color}55`,
            color: tower.color,
            fontWeight: 900,
            fontSize: "0.54rem"
          }}
        >
          {tower.cost}
        </span>
        {tower.iconPath ? (
          <img
            src={tower.iconPath}
            alt=""
            style={{
              width: "64%",
              height: "64%",
              objectFit: "contain",
              display: "block"
            }}
          />
        ) : (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              background: `${tower.color}24`,
              border: `2px solid ${tower.color}`
            }}
          />
        )}
      </div>
    </button>
  );
}

function EnemyCard({
  enemy,
  selected,
  disabled,
  onPick
}: {
  enemy: TowerDefenseCatalogEnemyModel;
  selected: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const initials = enemy.displayName.slice(0, 2).toUpperCase();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      style={{
        minHeight: 64,
        borderRadius: 14,
        border: selected ? `2px solid ${enemy.color}` : "1px solid var(--panel-border)",
        background: selected
          ? "linear-gradient(180deg, color-mix(in srgb, var(--amber) 24%, transparent), color-mix(in srgb, var(--surface) 92%, transparent))"
          : "color-mix(in srgb, var(--surface) 70%, transparent)",
        color: "var(--text-main)",
        padding: 5,
        textAlign: "left",
        opacity: disabled ? 0.55 : 1,
        display: "grid",
        gap: 2
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 34,
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid color-mix(in srgb, var(--muted) 16%, transparent)",
          background: `radial-gradient(circle at 30% 20%, ${enemy.color}33, color-mix(in srgb, var(--surface) 96%, transparent))`,
          display: "grid",
          placeItems: "center"
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 6,
            left: 3,
            zIndex: 1,
            padding: "2px 6px",
            borderRadius: 999,
            background: "color-mix(in srgb, var(--paper) 82%, transparent)",
            border: `1px solid ${enemy.color}55`,
            color: enemy.color,
            fontWeight: 900,
            fontSize: "0.5rem"
          }}
        >
          {enemy.sendCost}
        </span>
        {enemy.iconPath ? (
          <img
            src={enemy.iconPath}
            alt=""
            style={{
              width: "58%",
              height: "58%",
              objectFit: "contain",
              display: "block"
            }}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: `${enemy.color}33`,
              border: `2px solid ${enemy.color}`,
              display: "grid",
              placeItems: "center",
              color: enemy.color,
              fontWeight: 900,
              letterSpacing: "0.08em"
            }}
          >
            {initials}
          </div>
        )}
      </div>
    </button>
  );
}

function DetailStat({
  label,
  value,
  subtle = false
}: {
  label: string;
  value: string;
  subtle?: boolean;
}) {
  return (
    <div
      style={{
        padding: subtle ? "8px 10px" : "10px 12px",
        borderRadius: 14,
        background: "color-mix(in srgb, var(--accent-soft) 24%, transparent)",
        border: "1px solid color-mix(in srgb, var(--accent) 12%, transparent)"
      }}
    >
      <div style={{ color: "var(--text-muted)", fontSize: subtle ? "0.72rem" : "0.78rem" }}>{label}</div>
      <div
        style={{
          fontSize: subtle ? "0.84rem" : "0.94rem",
          fontWeight: subtle ? 500 : 700
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function TowerDefenseLayout({ model }: TowerDefenseLayoutProps) {
  const haptics = useHaptics();
  const en = model.language === "en";
  const previousLeakSignalCountRef = useRef<number | null>(null);
  const previousLivesRef = useRef<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedTowerTypeId, setSelectedTowerTypeId] = useState<string | null>(null);
  const [selectedEnemyTypeId, setSelectedEnemyTypeId] = useState<string | null>(null);
  const [showTowerInfo, setShowTowerInfo] = useState(true);

  useEffect(() => {
    setSelectedSlotId(model.map.buildSlots[0]?.id ?? null);
    setSelectedTowerTypeId(model.towerCatalog[0]?.id ?? null);
    setSelectedEnemyTypeId(model.enemyCatalog[0]?.id ?? null);
  }, [model.resetKey]);

  useEffect(() => {
    previousLeakSignalCountRef.current = model.currentPlayer?.leakSignalCount ?? model.currentPlayer?.leaks ?? null;
    previousLivesRef.current = model.currentPlayer?.lives ?? null;
  }, [model.currentPlayer?.playerId, model.resetKey]);

  useEffect(() => {
    const currentLeakSignalCount = model.currentPlayer?.leakSignalCount ?? model.currentPlayer?.leaks;
    const currentLives = model.currentPlayer?.lives;

    if (currentLeakSignalCount === undefined || currentLives === undefined) {
      previousLeakSignalCountRef.current = null;
      previousLivesRef.current = null;
      return;
    }

    const previousLeakSignalCount = previousLeakSignalCountRef.current;
    const previousLives = previousLivesRef.current;

    previousLeakSignalCountRef.current = currentLeakSignalCount;
    previousLivesRef.current = currentLives;

    if (previousLeakSignalCount === null || previousLives === null) {
      return;
    }

    const leakDelta = currentLeakSignalCount - previousLeakSignalCount;
    const lifeLoss = previousLives - currentLives;

    if (leakDelta <= 0 && lifeLoss <= 0) {
      return;
    }

    haptics.pattern(lifeLoss >= 2 || leakDelta >= 2 ? [60, 45, 110] : [85, 40, 70]);
  }, [haptics, model.currentPlayer?.leakSignalCount, model.currentPlayer?.leaks, model.currentPlayer?.lives]);

  useEffect(() => {
    if (!selectedSlotId) {
      setSelectedSlotId(model.map.buildSlots[0]?.id ?? null);
      return;
    }

    if (!model.map.buildSlots.some((slot) => slot.id === selectedSlotId)) {
      setSelectedSlotId(model.map.buildSlots[0]?.id ?? null);
    }
  }, [model.map.buildSlots, selectedSlotId]);

  useEffect(() => {
    if (!model.towerCatalog.some((tower) => tower.id === selectedTowerTypeId)) {
      setSelectedTowerTypeId(model.towerCatalog[0]?.id ?? null);
    }
  }, [model.towerCatalog, selectedTowerTypeId]);

  useEffect(() => {
    if (!model.enemyCatalog.some((enemy) => enemy.id === selectedEnemyTypeId)) {
      setSelectedEnemyTypeId(model.enemyCatalog[0]?.id ?? null);
    }
  }, [model.enemyCatalog, selectedEnemyTypeId]);

  const selectedSlot = useMemo(
    () => model.map.buildSlots.find((slot) => slot.id === selectedSlotId) ?? null,
    [model.map.buildSlots, selectedSlotId]
  );
  const selectedRangeOverlay =
    selectedSlot?.tower
      ? {
          col: selectedSlot.col,
          row: selectedSlot.row,
          range: selectedSlot.tower.range,
          color: selectedSlot.tower.color
        }
      : null;

  const buildTower = model.towerCatalog.find((entry) => entry.id === selectedTowerTypeId) ?? model.towerCatalog[0] ?? null;
  const selectedEnemy =
    model.enemyCatalog.find((entry) => entry.id === selectedEnemyTypeId) ?? model.enemyCatalog[0] ?? null;
  const currentGold = model.currentPlayer?.gold ?? 0;
  const buildCost = buildTower?.cost ?? Number.POSITIVE_INFINITY;
  const upgradeCost = selectedSlot?.tower?.upgradeCost ?? Number.POSITIVE_INFINITY;
  const sendCost = selectedEnemy?.sendCost ?? Number.POSITIVE_INFINITY;

  const canBuild = Boolean(
    selectedSlot && !selectedSlot.tower && buildTower && !model.buildDisabled && currentGold >= buildCost
  );
  const canUpgrade = Boolean(
    selectedSlot?.tower &&
      selectedSlot.tower.upgradeCost != null &&
      !model.buildDisabled &&
      currentGold >= upgradeCost
  );
  const canSell = Boolean(selectedSlot?.tower && !model.buildDisabled);
  const canSend = Boolean(selectedEnemy && !model.sendDisabled && currentGold >= sendCost);

  const targetLabel = model.nextTargetPlayer
    ? `${en ? "Next target" : "Naechstes Ziel"}: ${model.nextTargetPlayer.name}`
    : en ? "No active target" : "Kein aktives Ziel";

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <header
        style={{
          display: "grid",
          gap: 5,
          padding: 12,
          borderRadius: 18,
          border: "1px solid var(--panel-border)",
          background: "linear-gradient(180deg, color-mix(in srgb, var(--accent-soft) 90%, transparent), color-mix(in srgb, var(--surface) 86%, transparent))"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "baseline",
            flexWrap: "wrap"
          }}
        >
          <strong style={{ fontSize: "1.24rem", color: model.accentColor ?? "var(--accent)" }}>{model.title}</strong>
          <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>
            {model.map.name} | {model.map.cols}x{model.map.rows}
          </span>
        </div>
        <span style={{ color: "var(--text-muted)" }}>{model.subtitle}</span>
        <span style={{ color: "var(--text-muted)", lineHeight: 1.45 }}>{model.helperText}</span>
      </header>

      <section
        style={{
          display: "grid",
          gap: 8,
          padding: 10,
          borderRadius: 18,
          border: "1px solid var(--panel-border)",
          background: "color-mix(in srgb, var(--surface) 54%, transparent)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <strong>{en ? "Your Lane" : "Deine Lane"}</strong>
          <span style={{ color: "var(--text-muted)" }}>{targetLabel}</span>
        </div>
        {model.currentPlayer ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))", gap: 8 }}>
            <MetricCard label="Gold" value={model.currentPlayer.gold} />
            <MetricCard
              label="Income"
              value={`+${model.currentPlayer.incomeTickValue} / ${Math.max(
                1,
                Math.round(model.currentPlayer.incomeTickEveryMs / 1000)
              )}s`}
            />
            <MetricCard label={en ? "Lives" : "Leben"} value={model.currentPlayer.lives} />
            <MetricCard label="Kills" value={model.currentPlayer.kills} />
            <MetricCard label="Sends" value={model.currentPlayer.sends} />
          </div>
        ) : null}
      </section>

      <section style={{ display: "grid", gap: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <strong>{en ? "Blueprint" : "Bauplan"}</strong>
          <span style={{ color: "var(--text-muted)" }}>
            {selectedSlot ? `Slot ${selectedSlot.id.toUpperCase()} | ${selectedSlot.col},${selectedSlot.row}` : en ? "Tap build slot" : "Bauplatz antippen"}
          </span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
            <button
              type="button"
              disabled={!canBuild}
              onClick={() => {
                if (!selectedSlot || !buildTower) {
                  return;
                }

                model.onBuild(selectedSlot.id, buildTower.id);
              }}
              style={{
                minHeight: 58,
                borderRadius: 16,
                border: "1px solid var(--panel-border)",
                background: canBuild
                  ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 92%, transparent), color-mix(in srgb, var(--accent) 96%, transparent))"
                  : "color-mix(in srgb, var(--surface-raised) 72%, transparent)",
                color: canBuild ? "var(--accent-soft)" : "var(--text-muted)",
                fontWeight: 900,
                fontSize: "0.9rem",
                opacity: model.disabled ? 0.55 : 1
              }}
            >
              {buildTower ? `${en ? "Build" : "Bauen"} ${buildTower.cost}G` : en ? "Build" : "Bauen"}
            </button>
            <button
              type="button"
              disabled={!canUpgrade}
              onClick={() => {
                if (!selectedSlot) {
                  return;
                }

                model.onUpgrade(selectedSlot.id);
              }}
              style={{
                minHeight: 58,
                borderRadius: 16,
                border: "1px solid var(--panel-border)",
                background: canUpgrade
                  ? "linear-gradient(180deg, color-mix(in srgb, var(--sage) 92%, transparent), color-mix(in srgb, var(--sage) 96%, transparent))"
                  : "color-mix(in srgb, var(--surface-raised) 72%, transparent)",
                color: canUpgrade ? "var(--sage-strong)" : "var(--text-muted)",
                fontWeight: 900,
                fontSize: "0.9rem",
                opacity: model.disabled ? 0.55 : 1
              }}
            >
              {selectedSlot?.tower?.upgradeCost != null ? `Upgrade ${selectedSlot.tower.upgradeCost}G` : "Upgrade"}
            </button>
            <button
              type="button"
              disabled={!canSell}
              onClick={() => {
                if (!selectedSlot) {
                  return;
                }

                model.onSell(selectedSlot.id);
              }}
              style={{
                minHeight: 58,
                borderRadius: 16,
                border: "1px solid var(--panel-border)",
                background: canSell
                  ? "linear-gradient(180deg, color-mix(in srgb, var(--danger) 92%, transparent), color-mix(in srgb, var(--danger) 96%, transparent))"
                  : "color-mix(in srgb, var(--surface-raised) 72%, transparent)",
                color: canSell ? "var(--danger)" : "var(--text-muted)",
                fontWeight: 900,
                fontSize: "0.9rem",
                opacity: model.disabled ? 0.55 : 1
              }}
            >
              {selectedSlot?.tower ? `${en ? "Sell" : "Verkaufen"} ${selectedSlot.tower.sellValue}G` : en ? "Sell" : "Verkaufen"}
            </button>
            <button
              type="button"
              disabled={model.disabled}
              onClick={() => {
                setShowTowerInfo((current) => !current);
                haptics.tap(15);
              }}
              style={{
                minHeight: 58,
                borderRadius: 16,
                border: "1px solid var(--panel-border)",
                background: showTowerInfo
                  ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 26%, transparent), color-mix(in srgb, var(--surface) 92%, transparent))"
                  : "color-mix(in srgb, var(--surface-raised) 72%, transparent)",
                color: showTowerInfo ? "var(--text-main)" : "var(--text-muted)",
                fontWeight: 900,
                fontSize: "0.9rem",
                opacity: model.disabled ? 0.55 : 1
              }}
            >
              {showTowerInfo ? (en ? "Info on" : "Info an") : (en ? "Info off" : "Info aus")}
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gap: 4,
              padding: 10,
              borderRadius: 14,
              border: "1px solid var(--panel-border)",
              background: "color-mix(in srgb, var(--surface) 58%, transparent)"
            }}
          >
            <strong>{selectedSlot?.tower ? selectedSlot.tower.displayName : en ? "Free build slot" : "Freier Bauplatz"}</strong>
            <span style={{ color: "var(--text-muted)", lineHeight: 1.45 }}>
              {selectedSlot
                ? resolveTowerStatusText(selectedSlot.tower, en)
                : en ? "Choose one of the marked slots on your map to build a tower there." : "Waehle einen der markierten Slots auf deiner Map, um Tower direkt dort zu bauen."}
            </span>
          </div>
          <BuildBlueprint
            map={model.map}
            selectedSlotId={selectedSlotId}
            rangeOverlay={selectedRangeOverlay}
            disabled={model.disabled}
            accentColor={model.accentColor}
            en={en}
            onSelect={(slotId) => {
              setSelectedSlotId(slotId);
              haptics.tap(20);
            }}
          />
        </div>
      </section>

      <section style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <strong>{en ? "Choose Tower" : "Tower auswaehlen"}</strong>
          <span style={{ color: "var(--text-muted)" }}>
            {buildTower ? `${buildTower.displayName} | ${buildTower.cost}G` : en ? "Choose a tower for the marked slot" : "Waehl einen Tower fuer den markierten Slot"}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 5 }}>
          {model.towerCatalog.map((tower) => (
            <TowerCard
              key={tower.id}
              tower={tower}
              selected={tower.id === selectedTowerTypeId}
              disabled={model.disabled}
              onPick={() => {
                if (tower.id === selectedTowerTypeId) {
                  if (selectedSlot && !selectedSlot.tower && !model.buildDisabled && currentGold >= tower.cost) {
                    model.onBuild(selectedSlot.id, tower.id);
                    haptics.tap(24);
                    return;
                  }
                }

                setSelectedTowerTypeId(tower.id);
                haptics.tap(15);
              }}
            />
          ))}
        </div>
        {buildTower && showTowerInfo ? (
          <div
            style={{
              display: "grid",
              gap: 8,
              padding: 12,
              borderRadius: 18,
              border: "1px solid var(--panel-border)",
              background: "color-mix(in srgb, var(--surface) 60%, transparent)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "baseline",
                flexWrap: "wrap"
              }}
            >
              <strong>{buildTower.displayName}</strong>
              <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                Max Lvl. {buildTower.maxLevel}
              </span>
            </div>
            <div style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>{buildTower.description}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              <DetailStat
                label={en ? "Cost" : "Kosten"}
                value={formatLevelSeries(buildTower.levels.map((level) => level.price))}
                subtle
              />
              <DetailStat
                label="DMG"
                value={formatLevelSeries(buildTower.levels.map((level) => level.damage))}
                subtle
              />
              <DetailStat
                label="Range"
                value={formatLevelSeries(buildTower.levels.map((level) => level.range))}
                subtle
              />
              <DetailStat
                label="Atk Speed"
                value={formatLevelSeries(buildTower.levels.map((level) => level.fireRateMs), " ms")}
                subtle
              />
            </div>
          </div>
        ) : null}
      </section>

      <section style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <strong>{en ? "Send Enemies" : "Gegner senden"}</strong>
          <span style={{ color: "var(--text-muted)" }}>{currentGold}G</span>
        </div>
        <div style={{ maxHeight: 284, overflowY: "auto", paddingRight: 2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 5 }}>
            {model.enemyCatalog.map((enemy) => (
              <EnemyCard
                key={enemy.id}
                enemy={enemy}
                selected={enemy.id === selectedEnemyTypeId}
                disabled={model.disabled}
                onPick={() => {
                  if (enemy.id === selectedEnemyTypeId) {
                    if (!model.sendDisabled && currentGold >= enemy.sendCost) {
                      model.onSend(enemy.id);
                      haptics.tap(24);
                      return;
                    }
                  }

                  setSelectedEnemyTypeId(enemy.id);
                  haptics.tap(15);
                }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          disabled={!canSend}
          onClick={() => {
            if (!selectedEnemy) {
              return;
            }

            model.onSend(selectedEnemy.id);
          }}
          style={{
            minHeight: 62,
            borderRadius: 18,
            border: "1px solid var(--panel-border)",
            background: canSend
              ? "linear-gradient(180deg, color-mix(in srgb, var(--amber) 92%, transparent), color-mix(in srgb, var(--amber) 98%, transparent))"
              : "color-mix(in srgb, var(--surface-raised) 72%, transparent)",
            color: canSend ? "var(--danger)" : "var(--text-muted)",
            fontWeight: 900,
            letterSpacing: "0.04em",
            opacity: model.disabled ? 0.55 : 1
          }}
        >
          {selectedEnemy
            ? `${en ? "SEND TO" : "AN"} ${model.nextTargetPlayer?.name ?? "NEXT"} ${en ? "" : "SENDEN"} (${selectedEnemy.sendCost}G)`
            : en ? "SEND" : "SENDEN"}
        </button>
        {selectedEnemy ? (
          <div
            style={{
              display: "grid",
              gap: 8,
              padding: 12,
              borderRadius: 18,
              border: "1px solid var(--panel-border)",
              background: "color-mix(in srgb, var(--surface) 60%, transparent)"
            }}
          >
            <strong>{selectedEnemy.displayName}</strong>
            <div style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>{selectedEnemy.description}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: 8 }}>
              <DetailStat label={en ? "Cost" : "Kosten"} value={`${selectedEnemy.sendCost}`} />
              <DetailStat label="Income" value={`+${selectedEnemy.incomeBonus} / 15s`} />
              <DetailStat label="HP" value={`${selectedEnemy.maxHp}`} />
              <DetailStat label="Speed" value={formatNumber(selectedEnemy.speed)} />
              <DetailStat label="Bounty" value={`${selectedEnemy.bounty}`} />
              <DetailStat label="Leak Damage" value={`${selectedEnemy.damage}`} />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
