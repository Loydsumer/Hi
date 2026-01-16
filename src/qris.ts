/*
  Danzz For You 💌
*/

export const STATIC_QRIS = "00020101021126610014COM.GO-JEK.WWW01189360091433235676600210G3235676600303UMI51440014ID.CO.QRIS.WWW0215ID10264726415900303UMI5204899953033605802ID5925DANDI EKA SAPUTRA, Digita6006BANTUL61055576362070703A01630460EC" as string;

export function crc16(s: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < s.length; i++) {
        crc ^= s.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    let hex = (crc & 0xFFFF).toString(16).toUpperCase();
    if (hex.length === 3) hex = "0" + hex;
    else if (hex.length === 2) hex = "00" + hex;
    else if (hex.length === 1) hex = "000" + hex;
    return hex;
}

export function convertCRC16(str: string): string {
    const crc = crc16(str);
    return str + crc;
}

export function generateQrisDynamic(nominal: number): string {
    // Jika STATIC_QRIS kosong, return string kosong
    if (!STATIC_QRIS || STATIC_QRIS === "") {
        console.error("[✗] STATIC_QRIS belum diisi. Silakan isi dengan QRIS static yang valid.");
        return "";
    }

    try {
        let qris = STATIC_QRIS.slice(0, -4);
        let step1 = qris.replace("010211", "010212");
        let step2 = step1.split("5802ID");
        
        let sNominal = nominal.toString();
        let tag54 = "54" + sNominal.length.toString().padStart(2, '0') + sNominal;
        
        let str = step2[0] + tag54 + "5802ID" + step2[1] + "6304";
        const finalQr = convertCRC16(str);
        return finalQr;
    } catch (error) {
        console.error("[✗] Error generating QRIS:", error);
        return "";
    }
}

export function isStaticQrisConfigured(): boolean {
    return STATIC_QRIS !== "";
}