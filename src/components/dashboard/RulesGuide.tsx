'use client'

import React, { useState } from 'react'
import { CRITERIA_RULES } from '@/lib/scoring/constants'
import { PlusCircle, MinusCircle, ShieldAlert, Scale, CheckCircle2 } from 'lucide-react'

export function RulesGuide() {
  const [activeTab, setActiveTab] = useState<'add' | 'deduct' | 'principles'>('add')

  const criteriaArray = Object.values(CRITERIA_RULES)
  const addCriteria = criteriaArray.filter((c) => c.type === 'add')
  const deductCriteria = criteriaArray.filter((c) => c.type === 'deduct')

  const principles = [
    { code: 'P01', title: 'Thang điểm khép kín [0, 100]', desc: 'Mọi điểm số luôn nằm trong khoảng 0 đến 100. Điểm ban đầu là 60. Phạt khi ở 0 vẫn là 0, cộng khi ở 100 vẫn là 100.' },
    { code: 'P02', title: 'Chế tài Core Team nhân đôi (×2)', desc: '11 nhân sự nòng cốt (BCN, Trưởng/Phó ban) bị trừ điểm gấp đôi đối với các lỗi vi phạm nhằm nêu cao tinh thần gương mẫu. Điểm cộng giữ nguyên hệ số 1.' },
    { code: 'P03', title: 'Ngăn chặn tự duyệt (Anti-Self-Approval)', desc: 'Không ai được phép tự duyệt điểm của chính mình trong mọi trường hợp, kể cả Chủ nhiệm CLB.' },
    { code: 'P04', title: 'Điểm tương tác tối đa 15 điểm/tháng', desc: 'Tổng điểm cộng từ nhóm tương tác C01 + C02 + C03 không vượt quá 15 điểm/tháng/người. Quota tự động làm mới vào đầu tháng.' },
    { code: 'P05', title: 'Quy tắc thay thế & mức cao nhất', desc: 'C02 thay thế C01; T02 thay thế T01; T08 thay thế T07; T09 thay thế T07/T08. Trong cùng một đóng góp chỉ nhận mức cao nhất.' },
    { code: 'P06', title: 'Chế tài vắng họp T02 (Quy tắc 3 lần)', desc: 'Vắng họp không phép 3 lần trong nhiệm kỳ sẽ tự động kích hoạt quy trình xem xét dừng tư cách thành viên.' },
    { code: 'P07', title: 'Nghiệm thu 4 chuẩn đầu việc', desc: 'Đầu việc được cộng C05/C06 phải thỏa mãn: đúng yêu cầu, thông tin chính xác, hoàn chỉnh bàn giao, không làm lại do lỗi chủ quan.' },
    { code: 'P08', title: 'Bảo mật PII thành viên', desc: 'Bảng xếp hạng công khai tuyệt đối không chứa MSSV, SĐT, Email hay lịch sử lỗi kỷ luật cá nhân.' },
    { code: 'P09', title: 'Thời hạn giải trình & đối chiếu (Q06)', desc: 'Thành viên có quyền gửi đề nghị giải trình/sửa điểm trong vòng 3 ngày làm việc kể từ khi điểm được công bố.' },
    { code: 'P10', title: 'Ledger bất biến & Snapshot quyền', desc: 'Bản ghi điểm đã duyệt là bất biến. Nếu cần sửa, hệ thống sẽ ghi nhận bản ghi điều chỉnh (reversal/amendment).' },
  ]

  return (
    <div id="rules" className="space-y-6 pt-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5B301]">
            Quy chế vận hành
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Quy Tắc Tính Điểm & Chế Tài
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Bộ tiêu chí chuẩn C01-C09, T01-T13 và 10 Nguyên tắc vàng P01-P10 của Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 glass-panel rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'add'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Điểm cộng (C01-C09)</span>
        </button>

        <button
          onClick={() => setActiveTab('deduct')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'deduct'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <MinusCircle className="w-4 h-4" />
          <span>Điểm trừ (T01-T13)</span>
        </button>

        <button
          onClick={() => setActiveTab('principles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'principles'
              ? 'bg-[#1E63D6] text-white shadow-md shadow-[#1E63D6]/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Scale className="w-4 h-4 text-[#F5B301]" />
          <span>10 Nguyên tắc vàng (P01-P10)</span>
        </button>
      </div>

      {/* Content based on tab */}
      {activeTab === 'add' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addCriteria.map((c) => (
            <div
              key={c.code}
              className="glass-panel rounded-2xl p-5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {c.code}
                  </span>
                  <span className="text-lg font-black text-emerald-400">
                    +{c.base_points} điểm
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mb-2">{c.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
              </div>

              {c.monthly_cap_group === 'interaction' && (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#F5B301]">
                  <span>Điểm tương tác tối đa:</span>
                  <span className="font-bold">Tối đa 15 đ/tháng</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'deduct' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deductCriteria.map((c) => (
            <div
              key={c.code}
              className="glass-panel rounded-2xl p-5 border border-rose-500/20 hover:border-rose-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {c.code}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-black text-rose-400">
                      {c.base_points} điểm
                    </span>
                    <span className="block text-[10px] text-amber-300 font-bold">
                      Core: {c.base_points * 2} điểm
                    </span>
                  </div>
                </div>
                <h4 className="text-base font-bold text-white mb-2">{c.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
              </div>

              {c.code === 'T02' && (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-rose-400 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Vắng 3 lần kích hoạt xem xét dừng tư cách</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'principles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {principles.map((p) => (
            <div
              key={p.code}
              className="glass-panel rounded-2xl p-5 border border-[#1E63D6]/20 hover:border-[#1E63D6]/40 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#1E63D6]/20 text-[#60A5FA] border border-[#1E63D6]/30 flex items-center justify-center font-black text-xs flex-shrink-0">
                  {p.code}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1.5">{p.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
