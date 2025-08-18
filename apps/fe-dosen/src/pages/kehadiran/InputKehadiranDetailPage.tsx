"use client";

import { useParams } from "react-router-dom";
import { useState } from "react";
import { Input, Button, DatePicker, Switch, Breadcrumb, Modal } from "@widyatama/ui";
import { QRCodeSVG } from "qrcode.react";

type StatusKehadiran = "hadir" | "absen" | "izin" | "sakit";

export default function InputKehadiranDetail() {
  const { kode, pertemuan } = useParams();
  const [tanggal, setTanggal] = useState<Date | null>(new Date("2024-12-20"));
  const [jamMasuk, setJamMasuk] = useState("18:00");
  const [jamKeluar, setJamKeluar] = useState("20:00");
  const [materi, setMateri] = useState("Graphic Basic");
  const [kegiatan, setKegiatan] = useState<string[]>(["Diskusi"]);
  const [sesuaiSAP, setSesuaiSAP] = useState(true);
  const [modalQR, setModalQR] = useState(false);
  const [kehadiran, setKehadiran] = useState([
    { nim: "1234", nama: "Jupri ada dibelakang", status: "hadir" as StatusKehadiran, catatan: "" },
    { nim: "2345", nama: "Mikaela", status: "absen" as StatusKehadiran, catatan: "" },
  ]);

  const statusColorMap: Record<StatusKehadiran, string> = {
    hadir: "text-green-600",
    absen: "text-red-600",
    izin: "text-yellow-600",
    sakit: "text-blue-600",
  };

  const toggleKegiatan = (nama: string) => {
    setKegiatan((prev) =>
      prev.includes(nama)
        ? prev.filter((v) => v !== nama)
        : [...prev, nama]
    );
  };

  // const qrCodeData = JSON.stringify({
  //   kode,
  //   pertemuan,
  //   tanggal,
  // });

  return (
    <div className="space-y-6 p-4 grow">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Kehadiran", href: "/kehadiran" },
          {
            label: `Input Kehadiran - ${kode} Pertemuan ${pertemuan}`,
          },
        ]}
      />

      {/* Info Jadwal */}
      <div className="border p-4 rounded bg-gray-50 space-y-1">
        <div className="font-semibold text-lg">
          Reg A – {kode} – Graphic Design Fundamental
        </div>
        <div>Kelas A</div>
        <div>Jurusan Teknik Informatika</div>
        <div className="text-sm text-gray-600 mt-2">
          20 Desember 2024 | Sesi 18:00 – 20:30 WIB
        </div>
        <div className="text-sm text-gray-600">
          Dosen: Esa Fauzi, S.T., M.T.
        </div>
      </div>

      {/* Form Realisasi */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Realisasi</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Tanggal"
            selected={tanggal}
            onChange={(date) => setTanggal(date)}
          />

          <div className="flex gap-4">
            <Input
              label="Jam Masuk"
              value={jamMasuk}
              onChange={(e) => setJamMasuk(e.target.value)}
            />
            <Input
              label="Jam Keluar"
              value={jamKeluar}
              onChange={(e) => setJamKeluar(e.target.value)}
            />
          </div>
        </div>

        <Input
          label="Materi"
          value={materi}
          onChange={(e) => setMateri(e.target.value)}
        />

        <div>
          <label className="font-medium block mb-1">Kegiatan</label>
          <div className="flex flex-wrap gap-4">
            {["Ceramah", "Diskusi", "Tanya jawab", "Kuis", "Presentasi"].map(
              (k) => (
                <label key={k} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={kegiatan.includes(k)}
                    onChange={() => toggleKegiatan(k)}
                  />
                  {k}
                </label>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">Kesesuaian SAP</span>
          <Switch checked={sesuaiSAP} onCheckedChange={setSesuaiSAP} />
        </div>
      </div>

      {/* Tabel Kehadiran */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Kehadiran Mahasiswa</h2>
          <Button variant="outline" onClick={() => setModalQR(true)}>
            Generate QR Code
          </Button>
        </div>

        <table className="w-full text-sm border rounded overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-2 text-left">NPM</th>
              <th className="border px-2 py-2 text-left">Nama</th>
              <th className="border px-2 py-2 text-center">Status</th>
              <th className="border px-2 py-2 text-left">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {kehadiran.map((mhs, i) => (
              <tr key={mhs.nim} className="even:bg-gray-50">
                <td className="border px-2 py-2">{mhs.nim}</td>
                <td className="border px-2 py-2">{mhs.nama}</td>
                <td className="border px-2 py-2 text-center">
                <div className="flex flex-wrap gap-4 justify-center">
                  {(["hadir", "absen", "izin", "sakit"] as StatusKehadiran[]).map((status) => (
                    <label
                      key={status}
                      className={`inline-flex items-center gap-1 cursor-pointer text-sm ${statusColorMap[status]}`}
                    >
                      <input
                        type="radio"
                        name={`status-${i}`}
                        value={status}
                        checked={mhs.status === status}
                        onChange={() =>
                          setKehadiran((prev) =>
                            prev.map((m, j) =>
                              j === i ? { ...m, status } : m
                            )
                          )
                        }
                        className="accent-current"
                      />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </label>
                  ))}
                </div>
              </td>
                <td className="border px-2 py-2">
                  <Input
                    value={mhs.catatan}
                    placeholder="Catatan (opsional)"
                    onChange={(e) =>
                      setKehadiran((prev) =>
                        prev.map((m, j) =>
                          j === i ? { ...m, catatan: e.target.value } : m
                        )
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Modal
          open={modalQR}
          onOpenChange={setModalQR}
          title="QR Code Kehadiran"
          description="Scan QR untuk mencatat kehadiran."
          variant="info"
          footer={
            <Button onClick={() => setModalQR(false)}>Tutup</Button>
          }
        >
          <div className="flex justify-center py-4">
            <QRCodeSVG value="https://reactjs.org/" size={200} />
          </div>
        </Modal>
        <div className="flex justify-end pt-6">
          <Button type="submit" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save
          </Button>
        </div>

        

      </div>
    </div>
  );
}
