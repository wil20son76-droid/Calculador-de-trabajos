"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, DoorOpen, PanelTop } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { computeRoomMeasurements } from "@/lib/calc/measurements";
import { formatNumber } from "@/lib/utils/format";
import {
  emptyOpening,
  emptyRoom,
  type RoomDraft,
  type RoomOpeningDraft,
} from "@/lib/quotes/draft-types";

const OPENING_LABELS: Record<RoomOpeningDraft["type"], string> = {
  DOOR: "Puerta",
  WINDOW: "Ventana",
  OTHER: "Otra abertura",
};

export function RoomManager({
  rooms,
  onChange,
}: {
  rooms: RoomDraft[];
  onChange: (rooms: RoomDraft[]) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addRoom() {
    const room = emptyRoom();
    onChange([...rooms, room]);
    setExpanded((prev) => new Set(prev).add(room.id));
  }

  function updateRoom(id: string, patch: Partial<RoomDraft>) {
    onChange(rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRoom(id: string) {
    if (!confirm("¿Eliminar esta habitación? Los trabajos que la usen perderán la medición.")) return;
    onChange(rooms.filter((r) => r.id !== id));
  }

  function addOpening(roomId: string, type: RoomOpeningDraft["type"]) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    updateRoom(roomId, { openings: [...room.openings, emptyOpening(type)] });
  }

  function updateOpening(roomId: string, openingId: string, patch: Partial<RoomOpeningDraft>) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    updateRoom(roomId, {
      openings: room.openings.map((o) => (o.id === openingId ? { ...o, ...patch } : o)),
    });
  }

  function removeOpening(roomId: string, openingId: string) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    updateRoom(roomId, { openings: room.openings.filter((o) => o.id !== openingId) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Habitaciones / Zonas</h2>
        <Button size="sm" variant="outline" onClick={addRoom}>
          <Plus className="h-4 w-4" /> Añadir habitación
        </Button>
      </div>

      {rooms.length === 0 && (
        <Card className="border-dashed text-center text-sm text-slate-400">
          Sin habitaciones. Añade el salón, dormitorios, cocina... para poder reutilizar sus
          medidas en los trabajos (pintura, suelos, rodapiés...).
        </Card>
      )}

      <div className="space-y-2">
        {rooms.map((room) => {
          const m = computeRoomMeasurements(room, room.openings);
          const isOpen = expanded.has(room.id);
          return (
            <Card key={room.id} className="p-0">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Input
                  value={room.name}
                  onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                  placeholder="Nombre (Salón, Cocina, Dormitorio 1...)"
                  className="min-w-[160px] flex-1 font-medium"
                />
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={room.length}
                    onChange={(e) => updateRoom(room.id, { length: Number(e.target.value) })}
                    className="w-20 py-1.5"
                  />
                  <span>×</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={room.width}
                    onChange={(e) => updateRoom(room.id, { width: Number(e.target.value) })}
                    className="w-20 py-1.5"
                  />
                  <span>m, alto</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={room.height}
                    onChange={(e) => updateRoom(room.id, { height: Number(e.target.value) })}
                    className="w-20 py-1.5"
                  />
                  <span>m</span>
                </div>
                <button
                  onClick={() => toggle(room.id)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => removeRoom(room.id)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-4 py-2 text-xs text-slate-500 sm:grid-cols-5">
                <span>Suelo: <b className="text-slate-700">{formatNumber(m.floorArea, 2)} m²</b></span>
                <span>Techo: <b className="text-slate-700">{formatNumber(m.ceilingArea, 2)} m²</b></span>
                <span>Perímetro: <b className="text-slate-700">{formatNumber(m.perimeter, 2)} m</b></span>
                <span>Paredes brutas: <b className="text-slate-700">{formatNumber(m.grossWallArea, 2)} m²</b></span>
                <span>Paredes netas: <b className="text-emerald-700">{formatNumber(m.netWallArea, 2)} m²</b></span>
              </div>

              {isOpen && (
                <div className="space-y-2 border-t border-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase text-slate-400">
                      Puertas y ventanas
                    </h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => addOpening(room.id, "DOOR")}>
                        <DoorOpen className="h-3.5 w-3.5" /> + Puerta
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => addOpening(room.id, "WINDOW")}>
                        <PanelTop className="h-3.5 w-3.5" /> + Ventana
                      </Button>
                    </div>
                  </div>

                  {room.openings.length === 0 && (
                    <p className="text-sm text-slate-400">Sin aberturas registradas.</p>
                  )}

                  {room.openings.map((o) => (
                    <div key={o.id} className="flex items-center gap-2 text-sm">
                      <Select
                        value={o.type}
                        onChange={(e) =>
                          updateOpening(room.id, o.id, {
                            type: e.target.value as RoomOpeningDraft["type"],
                          })
                        }
                        className="w-32 py-1.5"
                      >
                        {Object.entries(OPENING_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                      <Field label="" className="w-20">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={o.width}
                          onChange={(e) =>
                            updateOpening(room.id, o.id, { width: Number(e.target.value) })
                          }
                          className="py-1.5"
                        />
                      </Field>
                      <span className="text-slate-400">×</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={o.height}
                        onChange={(e) =>
                          updateOpening(room.id, o.id, { height: Number(e.target.value) })
                        }
                        className="w-20 py-1.5"
                      />
                      <span className="text-slate-400">m ×</span>
                      <Input
                        type="number"
                        min={1}
                        value={o.quantity}
                        onChange={(e) =>
                          updateOpening(room.id, o.id, { quantity: Number(e.target.value) })
                        }
                        className="w-16 py-1.5"
                      />
                      <span className="text-slate-400 text-xs">
                        = {formatNumber(o.width * o.height * o.quantity, 2)} m²
                      </span>
                      <button
                        onClick={() => removeOpening(room.id, o.id)}
                        className="ml-auto rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
