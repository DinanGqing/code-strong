import { useState, useRef, useEffect, useCallback } from 'react';
import { Container, Box, Typography, Card, CardContent, Grid, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tabs, Tab } from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import RedoIcon from '@mui/icons-material/Redo';
import CloseIcon from '@mui/icons-material/Close';

const GAME_INFO = {
  title: '破晓：终极格斗',
  titleEn: 'Dawn: Ultimate Fight',
  tagline: '以拳证道，谁主沉浮',
  sloganZH: ['以拳证道，谁主沉浮', '打破极限，迎接破晓', '不仅是格斗，更是生存'],
  sloganEN: ['Fight for your destiny.', 'The world is your ring.', 'Unleash your power.'],
  status: '即将公测',
  year: '2026',
};

const CHARACTERS = [
  {id:"shengLong",name:"升龙 李小龙",title:"波动流传承者",emoji:"🥋",type:"均衡型",typeColor:"#00D4FF",bg:"linear-gradient(135deg, #0a1a3e, #1a0a3e)",accent:"#00D4FF",story:"为了寻找格斗的真谛，他离开了师父的道场，独自踏上旅途。他的右臂封印着传说中的波动流奥义。",style:"均衡型。擅长波动拳牵制，升龙拳对空，以及迅猛的连招。",quote:"我的拳头，能劈开大海！",hp:1000,atk:85,def:75,spd:80,skills:[{name:"波动拳",key:"↓↘→ + P",dmg:80,desc:"气功波远程攻击"},{name:"升龙拳",key:"→↓↘ + P",dmg:120,desc:"无敌对空技"},{name:"龙卷旋风腿",key:"↓↙← + K",dmg:100,desc:"多段连击"}],ca:{name:"灭·波动奥义",key:"↓↘→↓↘→ + P",dmg:350,desc:"究极奥义，毁天灭地"}},
  {id:"titan",name:"泰坦",title:"钢铁巨兽",emoji:"🏋️",type:"力量型",typeColor:"#FF6B35",bg:"linear-gradient(135deg, #2a0a1e, #3a0a2e)",accent:"#FF6B35",story:"曾经的特种部队王牌，因一次实验事故获得了钢铁之躯。他没有痛觉，唯一的乐趣就是碾压对手。",style:"投技专家。移动缓慢但防御极高，抓取判定极强，一旦被抓住就难以逃脱。",quote:"碾碎你，就像碾碎一只虫子。",hp:1200,atk:90,def:95,spd:40,skills:[{name:"原子弹爆摔",key:"→↘↓↙←→ + P",dmg:130,desc:"抓取投技，超高伤害"},{name:"钢铁冲撞",key:"←↙↓↘→ + P",dmg:90,desc:"霸体冲撞"},{name:"大地震击",key:"↓↙← + K",dmg:70,desc:"范围震地攻击"}],ca:{name:"末日碾压",key:"→↘↓↙←→↘↓↙← + P",dmg:400,desc:"终极投技，无可逃脱"}},
  {id:"lingYan",name:"灵燕",title:"疾风刑警",emoji:"🦅",type:"敏捷型",typeColor:"#00FF88",bg:"linear-gradient(135deg, #0a2a1e, #0a3a2e)",accent:"#00FF88",story:"国际刑警。为了追查杀害父亲的阴谋，她苦练腿法。她的速度无人能及。",style:"速度压制。拥有多段踢和快速的位移技能，擅长立回和确反。",quote:"正义，从不迟到。",hp:900,atk:75,def:65,spd:100,skills:[{name:"百裂腿",key:"K 连打",dmg:60,desc:"超高速多段踢击"},{name:"旋风腿",key:"→↓↘ + K",dmg:85,desc:"空中回旋下压"},{name:"飞燕脚",key:"↓↘→ + K",dmg:70,desc:"突进下段踢"}],ca:{name:"凤翼天翔",key:"↓↘→↓↘→ + K",dmg:300,desc:"华丽终结技，漫天腿影"}},
  {id:"xuKong",name:"虚空",title:"暗物质支配者",emoji:"👁️",type:"神秘型",typeColor:"#9B59B6",bg:"linear-gradient(135deg, #1a0a2e, #2a0a4e)",accent:"#9B59B6",story:"来自异次元的生命体，身体由暗物质构成。他吸收格斗家的能量来维持形态。",style:"变幻莫测。可以复制对手的部分招式，拥有独特的瞬移机制。",quote:"恐惧……是你最好的养料。",hp:950,atk:80,def:70,spd:90,skills:[{name:"虚空瞬移",key:"↓↘→ + 任意",dmg:50,desc:"瞬移到对手身后"},{name:"暗影球",key:"↓↙← + P",dmg:75,desc:"暗物质能量球"},{name:"复制",key:"→↓↘ + K",dmg:0,desc:"复制对手技能，持续15秒"}],ca:{name:"无尽深渊",key:"↓↘→↓↘→ + 任意",dmg:380,desc:"将对手拖入虚空"}},
];

const ACTION_TYPES = [
  { id: "light", label: "轻击", icon: "👊", dmgMult: 0.6 },
  { id: "heavy", label: "重击", icon: "💥", dmgMult: 1.0 },
  { id: "special", label: "技能", icon: "🔥", dmgMult: 1.4 },
  { id: "block", label: "防御", icon: "🛡️", dmgMult: 0 },
  { id: "ultra", label: "超必杀", icon: "⭐", dmgMult: 2.5 },
];

function calcDamage(atk, def, action) {
  if (action.id === "block") return { dmg: 0, crit: false, spiritGain: 5 + Math.floor(Math.random() * 6) };
  let base = Math.max(8, Math.floor(8 * (atk.atk / 100) * (1 - (def.def / 100) * 0.3) * (0.85 + Math.random() * 0.3) * action.dmgMult));
  if (action.id === "ultra") base = Math.floor(base * 1.8);
  const crit = Math.random() < 0.1;
  return { dmg: Math.floor(base * (crit ? 1.5 : 1)), crit, spiritGain: 2 };
}

function getAIAction(ai, spirit) {
  if (spirit >= 100 && Math.random() < 0.3 && ai.hp < 600) return ACTION_TYPES[4];
  if (spirit >= 25 && Math.random() < 0.35) return ACTION_TYPES[2];
  if (ai.hp < 360 && Math.random() < 0.4) return ACTION_TYPES[3];
  return Math.random() < 0.5 ? ACTION_TYPES[1] : ACTION_TYPES[0];
}

function FightArena({ pc, ai, pAct, aAct, result }) {
  const koColor = result === "win" ? "#00FF88" : result === "lose" ? "#FF6B35" : "transparent";
  return (
    <Box sx={{ position: "relative", width: "100%", height: 280, borderRadius: 3, overflow: "hidden", mb: 2,
      background: "linear-gradient(180deg, #0a0a2e, #1a0a3e, #0a0a1e)",
      border: "1px solid " + (result ? koColor : "rgba(255,255,255,0.08)") }}>
      <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
        background: "linear-gradient(0deg, rgba(0,212,255,0.05), transparent)",
        borderTop: "1px solid rgba(0,212,255,0.15)" }} />
      <Box sx={{ position: "absolute", top: 10, left: 14, color: "rgba(0,212,255,0.12)", fontSize: "0.55rem", fontFamily: "monospace" }}>
        {GAME_INFO.titleEn} / {GAME_INFO.year}
      </Box>
      {result && (
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 5, textAlign: "center" }}>
          <Typography variant="h2" sx={{ fontWeight: 900, color: koColor, textShadow: "0 0 40px " + koColor, letterSpacing: 8 }}>
            {result === "win" ? "K.O.!" : "DEFEATED"}
          </Typography>
        </Box>
      )}
      <Box sx={{ position: "absolute", bottom: 50, left: "18%", textAlign: "center", zIndex: 2, opacity: result === "lose" ? 0.4 : 1 }}>
        <Box sx={{ fontSize: "3.2rem" }}>{pc ? pc.emoji : "🥋"}</Box>
        <Typography variant="caption" sx={{ color: pc ? pc.accent : "#00D4FF", fontWeight: 700, display: "block", fontSize: "0.6rem" }}>
          {pc ? pc.name : "玩家"}
        </Typography>
      </Box>
      {pAct && !result && (
        <Box sx={{ position: "absolute", bottom: 100, left: "6%", zIndex: 3 }}>
          <Chip label={pAct} size="small" sx={{ background: "rgba(0,212,255,0.2)", color: "#00D4FF", fontWeight: 700, fontSize: "0.6rem", border: "1px solid rgba(0,212,255,0.3)" }} />
        </Box>
      )}
      {!result && <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "1.6rem", fontWeight: 900, color: "rgba(255,107,53,0.2)", letterSpacing: 4, zIndex: 1 }}>VS</Box>}
      <Box sx={{ position: "absolute", bottom: 50, right: "18%", textAlign: "center", zIndex: 2, opacity: result === "win" ? 0.4 : 1 }}>
        <Box sx={{ fontSize: "3.2rem" }}>{ai ? ai.emoji : "👹"}</Box>
        <Typography variant="caption" sx={{ color: ai ? ai.accent : "#FF6B35", fontWeight: 700, display: "block", fontSize: "0.6rem" }}>
          {ai ? ai.name : "AI"}
        </Typography>
      </Box>
      {aAct && !result && (
        <Box sx={{ position: "absolute", bottom: 100, right: "6%", zIndex: 3 }}>
          <Chip label={aAct} size="small" sx={{ background: "rgba(255,107,53,0.2)", color: "#FF6B35", fontWeight: 700, fontSize: "0.6rem", border: "1px solid rgba(255,107,53,0.3)" }} />
        </Box>
      )}
    </Box>
  );
}

export default function Games() {
  const [tab, setTab] = useState(0);
  const [started, setStarted] = useState(false);
  const [pc, setPc] = useState(null);
  const [ai, setAi] = useState(null);
  const [php, setPhp] = useState(0);
  const [ahp, setAhp] = useState(0);
  const [psp, setPsp] = useState(0);
  const [asp, setAsp] = useState(0);
  const [pAct, setPAct] = useState("");
  const [aAct, setAAct] = useState("");
  const [log, setLog] = useState([]);
  const [result, setResult] = useState("");
  const turn = useRef(false);
  const logEnd = useRef(null);

  const addLog = useCallback((m) => setLog(function(prev) { return prev.concat(m).slice(-99); }), []);
  useEffect(() => { if (logEnd.current) logEnd.current.scrollIntoView({ behavior: "smooth" }); }, [log]);

  const startBattle = useCallback(function() {
    if (!pc) return;
    var opp = [];
    for (var i = 0; i < CHARACTERS.length; i++) {
      if (CHARACTERS[i].id !== pc.id) opp.push(CHARACTERS[i]);
    }
    var aiChar = opp[Math.floor(Math.random() * opp.length)];
    setAi(aiChar);
    setPhp(pc.hp);
    setAhp(aiChar.hp);
    setPsp(20);
    setAsp(25);
    setLog([]);
    setResult("");
    setPAct("");
    setAAct("");
    setStarted(true);
    addLog("🥊 战斗开始！" + pc.name + " VS " + aiChar.name);
    turn.current = true;
  }, [pc, addLog]);

  const resetBattle = function() {
    setStarted(false);
    setResult("");
    setPhp(0);
    setAhp(0);
    setPsp(0);
    setAsp(0);
    setPAct("");
    setAAct("");
    setLog([]);
    turn.current = false;
  };

  const doAction = useCallback(function(act) {
    if (!turn.current || !ai || !pc || result) return;
    if (act.id === "ultra" && psp < 100) return;
    turn.current = false;
    var spCost = act.id === "special" ? 25 : act.id === "ultra" ? 100 : 0;
    var pr = calcDamage(pc, ai, act);
    var nAhp = Math.max(0, ahp - pr.dmg);
    var nPsp = Math.min(100, psp - spCost + pr.spiritGain);
    setPAct(act.icon + " " + act.label + (pr.crit ? " 💥会心!" : ""));
    if (pr.dmg > 0) {
      addLog("⚔️ 你使出【" + act.label + "】造成 " + pr.dmg + (pr.crit ? "（会心！）" : ""));
    } else {
      addLog("🛡️ 防御姿态，气力 +" + pr.spiritGain);
    }
    setAhp(nAhp);
    setPsp(nPsp);
    if (nAhp <= 0) {
      setResult("win");
      addLog("🏆 胜利！" + ai.name + " 被击败！");
      turn.current = false;
      return;
    }
    setTimeout(function() {
      var aiAct = getAIAction(ai, asp);
      var ar = calcDamage(ai, pc, aiAct);
      var nPhp = Math.max(0, php - ar.dmg);
      var nAsp = Math.min(100, asp - (aiAct.id === "special" ? 25 : aiAct.id === "ultra" ? 100 : 0) + ar.spiritGain);
      setAAct(aiAct.icon + " " + aiAct.label + (ar.crit ? " 💥会心!" : ""));
      if (ar.dmg > 0) {
        addLog("⚔️ " + ai.name + " 使出【" + aiAct.label + "】造成 " + ar.dmg + (ar.crit ? "（会心！）" : ""));
      } else {
        addLog("🛡️ " + ai.name + " 摆出防御姿态");
      }
      setPhp(nPhp);
      setAsp(nAsp);
      if (nPhp <= 0) {
        setResult("lose");
        addLog("💀 你被 " + ai.name + " 击败了...");
      }
      turn.current = true;
    }, 600);
  }, [php, ahp, psp, asp, pc, ai, result, addLog]);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Tabs value={tab} onChange={function(e, v) { setTab(v); }}
        sx={{ mb: 3,
          "& .MuiTabs-indicator": { background: "linear-gradient(90deg, #FF6B35, #9B59B6)" },
          "& .MuiTab-root": { color: "text.secondary", fontWeight: 600, "&.Mui-selected": { color: "#FF6B35" } },
        }}>
        <Tab label="🎮 格斗对战" />
        <Tab label="📖 资料库" />
        <Tab label="🎬 宣传" />
        <Tab label="👥 双人对战" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, background: "linear-gradient(135deg, #FF6B35, #9B59B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", mb: 0.5 }}>
              {GAME_INFO.title}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "text.secondary" }}>{GAME_INFO.tagline}</Typography>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1.5, color: "#00D4FF", fontWeight: 700 }}>🎯 选择你的角色</Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {CHARACTERS.map(function(c) {
              var selected = pc && pc.id === c.id;
              return (
                <Grid item xs={6} sm={3} key={c.id}>
                  <Card onClick={function() { setPc(c); if (started) resetBattle(); }}
                    sx={{
                      cursor: "pointer",
                      background: c.bg,
                      border: selected ? "2px solid " + c.accent : "1px solid rgba(255,255,255,0.06)",
                      transition: "all 0.2s",
                      "&:hover": { transform: "translateY(-2px)", borderColor: c.accent },
                    }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center" }}>
                      <Box sx={{ fontSize: "2rem" }}>{c.emoji}</Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: c.accent, fontSize: "0.7rem" }}>{c.name}</Typography>
                      <Chip label={c.type} size="small" sx={{ mt: 0.3, height: 18, fontSize: "0.55rem", background: c.typeColor + "22", color: c.typeColor }} />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {!started ? (
            <Box sx={{ textAlign: "center", my: 3 }}>
              <Button variant="contained" size="large" onClick={startBattle} disabled={!pc}
                startIcon={<WhatshotIcon />}
                sx={{ background: "linear-gradient(135deg, #FF6B35, #E74C3C)", fontSize: "1rem", px: 5, py: 1.3, borderRadius: 3,
                  "&:hover": { background: "linear-gradient(135deg, #FF8C5E, #FF5252)" }, "&:disabled": { background: "rgba(255,255,255,0.1)" } }}>
                🔥 开始战斗！FIGHT！🔥
              </Button>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={1} sx={{ mb: 1 }}>
                <Grid item xs={6}>
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.2 }}>
                      <Typography variant="caption" sx={{ color: pc.accent, fontWeight: 700, fontSize: "0.7rem" }}>{pc.name}</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{php}/{pc.hp}</Typography>
                    </Box>
                    <Box sx={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: Math.max(0, (php / pc.hp) * 100) + "%", background: php > pc.hp * 0.3 ? "linear-gradient(90deg, #00D4FF, #00FF88)" : "linear-gradient(90deg, #FF6B35, #E74C3C)", borderRadius: 5, transition: "width 0.3s ease" }} />
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: "right" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.2 }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{ahp}/{ai ? ai.hp : 1200}</Typography>
                      <Typography variant="caption" sx={{ color: ai ? ai.accent : "#FF6B35", fontWeight: 700, fontSize: "0.7rem" }}>{ai ? ai.name : "AI"}</Typography>
                    </Box>
                    <Box sx={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: Math.max(0, (ahp / (ai ? ai.hp : 1200)) * 100) + "%", float: "right", background: ahp > (ai ? ai.hp : 1200) * 0.3 ? "linear-gradient(90deg, #00FF88, #00D4FF)" : "linear-gradient(90deg, #E74C3C, #FF6B35)", borderRadius: 5, transition: "width 0.3s ease" }} />
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Grid container spacing={1} sx={{ mb: 1 }}>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: "#FFD700", fontSize: "0.6rem" }}>气力</Typography>
                    <Box sx={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden", maxWidth: 100 }}>
                      <Box sx={{ height: "100%", width: (psp / 100) * 100 + "%", background: psp >= 100 ? "linear-gradient(90deg, #FFD700, #FF6B35)" : "linear-gradient(90deg, #6366F1, #00D4FF)", borderRadius: 3, transition: "width 0.3s" }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.55rem" }}>{psp}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.55rem" }}>{asp}</Typography>
                    <Box sx={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden", maxWidth: 100 }}>
                      <Box sx={{ height: "100%", width: (asp / 100) * 100 + "%", float: "right", background: asp >= 100 ? "linear-gradient(90deg, #FFD700, #FF6B35)" : "linear-gradient(90deg, #6366F1, #00D4FF)", borderRadius: 3, transition: "width 0.3s" }} />
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <FightArena pc={pc} ai={ai} pAct={pAct} aAct={aAct} result={result} />

              {result ? (
                <Box sx={{ textAlign: "center", mt: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1.5, color: result === "win" ? "#00FF88" : "#FF6B35", fontWeight: 800 }}>
                    {result === "win" ? "🏆 KO！你赢了！" : "💀 你被击败了..."}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
                    <Button variant="outlined" onClick={startBattle} startIcon={<RedoIcon />} sx={{ borderColor: "#00D4FF", color: "#00D4FF", borderRadius: 2 }}>再来一局</Button>
                    <Button variant="outlined" onClick={resetBattle} sx={{ borderColor: "rgba(255,255,255,0.2)", color: "text.secondary", borderRadius: 2 }}>换角色</Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: "text.secondary", mb: 1, fontSize: "0.7rem" }}>
                    ⚡ 选择行动{psp >= 100 ? "（⭐ 超必杀就绪！）" : ""}
                  </Typography>
                  <Grid container spacing={1}>
                    {ACTION_TYPES.map(function(act) {
                      var canUse = act.id === "ultra" ? psp >= 100 : act.id === "special" ? psp >= 25 : true;
                      var btnColor = act.id === "ultra" && canUse ? "#FFD700" : act.id === "special" ? "#FF6B35" : "text.secondary";
                      return (
                        <Grid item xs={2.4} key={act.id}>
                          <Button variant="outlined" fullWidth disabled={!canUse} onClick={function() { doAction(act); }}
                            sx={{
                              py: 1, px: 0.5, fontSize: "0.65rem",
                              borderColor: canUse ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                              color: btnColor,
                              background: act.id === "ultra" && canUse ? "rgba(255,215,0,0.08)" : "transparent",
                              "&:hover": canUse ? { borderColor: "#00D4FF", background: "rgba(0,212,255,0.08)" } : {},
                            }}>
                            {act.icon} {act.label}
                          </Button>
                        </Grid>
                      );
                    })}
                  </Grid>
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
                    <Button variant="outlined" size="small" onClick={resetBattle} sx={{ borderColor: "rgba(255,255,255,0.15)", color: "text.secondary", fontSize: "0.7rem" }}>投降</Button>
                  </Box>
                </Box>
              )}

              <Card sx={{ mt: 3, background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <CardContent sx={{ p: 2, maxHeight: 150, overflow: "auto" }}>
                  <Typography variant="caption" sx={{ color: "#FFD700", fontWeight: 700, display: "block", mb: 1 }}>📋 战报</Typography>
                  {log.map(function(m, i) {
                    return <Typography key={i} variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.65rem", lineHeight: 1.8 }}>{m}</Typography>;
                  })}
                  <div ref={logEnd} />
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: "#00D4FF" }}>📖 角色资料库</Typography>
          <Grid container spacing={2.5}>
            {CHARACTERS.map(function(c) {
              var statColor = { hp: "#00FF88", atk: "#FF6B35", def: "#00D4FF", spd: "#9B59B6" };
              return (
                <Grid item xs={12} sm={6} key={c.id}>
                  <Card sx={{ background: c.bg, border: "1px solid rgba(255,255,255,0.06)", height: "100%" }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                        <Box sx={{ fontSize: "3rem" }}>{c.emoji}</Box>
                        <Box>
                          <Typography variant="h6" sx={{ color: c.accent, fontWeight: 800 }}>{c.name}</Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>{c.title}</Typography>
                          <Chip label={c.type} size="small" sx={{ ml: 1, height: 18, fontSize: "0.55rem", background: c.typeColor + "22", color: c.typeColor }} />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 1.5, fontSize: "0.8rem" }}>{c.story}</Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", display: "block", mb: 1, fontStyle: "italic" }}>「{c.quote}」</Typography>
                      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                        {["hp", "atk", "def", "spd"].map(function(s) {
                          return <Chip key={s} label={s.toUpperCase() + " " + c[s]} size="small" sx={{ background: statColor[s] + "11", color: statColor[s], fontSize: "0.6rem" }} />;
                        })}
                      </Box>
                      <Typography variant="subtitle2" sx={{ color: c.accent, fontSize: "0.75rem", mt: 1, mb: 0.5 }}>技能</Typography>
                      {c.skills.map(function(s, i) {
                        return <Typography key={i} variant="caption" sx={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>· {s.name}（{s.key}）</Typography>;
                      })}
                      <Typography variant="subtitle2" sx={{ color: "#FFD700", fontSize: "0.75rem", mt: 1, mb: 0.5 }}>⭐ 超必杀：{c.ca.name}</Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.65rem" }}>{c.ca.key} - {c.ca.desc}（伤害：{c.ca.dmg}）</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}


          <Card sx={{ mb: 4, background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "#FF6B35", fontWeight: 700, mb: 2 }}>🔥 主宣传片文案</Typography>
              <Box sx={{ borderLeft: "2px solid rgba(255,107,53,0.3)", pl: 2, mb: 2 }}>
                <Typography variant="caption" sx={{ display: "block", color: "rgba(255,255,255,0.4)", mb: 0.5, fontSize: "0.6rem" }}>[开场]</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5, fontSize: "0.8rem" }}>画面漆黑，只有一声沉闷的心跳声。咚……咚……咚…… 一道裂痕划破黑暗，火焰与雷电从中迸发。</Typography>
                <Typography variant="body2" sx={{ color: "#9B59B6", mt: 1, mb: 0.5, fontSize: "0.85rem", fontWeight: 600 }}>旁白（低沉、有磁性）：</Typography>
                <Typography variant="body2" sx={{ color: "#FFD700", mb: 0.3, fontSize: "0.8rem" }}>"在这个世界，力量决定一切。"</Typography>
                <Typography variant="body2" sx={{ color: "#FFD700", mb: 0.3, fontSize: "0.8rem" }}>"有人说，格斗是野蛮人的运动。但他们错了。"</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 1, mb: 0.5, fontSize: "0.8rem" }}>一位身着唐装的武者，周身环绕着蓝色的波动气。对面，一个机械改造人像坦克一样碾压而来。</Typography>
                <Typography variant="body2" sx={{ color: "#FFD700", mb: 0.3, fontSize: "0.8rem" }}>"这不仅仅是肌肉的交锋。这是意志的碰撞。是打破宿命的唯一方式。"</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5, fontSize: "0.8rem" }}>两人对冲，拳头与拳套相抵。静止一秒。</Typography>
                <Typography variant="body2" sx={{ color: "#00FF88", fontWeight: 800, fontSize: "1.2rem", textAlign: "center", my: 1.5 }}>轰——！！！</Typography>
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "#FF6B35" }}>{GAME_INFO.title}</Typography>
                  <Typography variant="body1" sx={{ color: "#FFD700", mt: 1 }}>2026年，全球公测。你，敢来挑战吗？</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 4, background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "#6366F1", fontWeight: 700, mb: 2 }}>🎬 角色预告片：「狂虎」VS「幽影」</Typography>
              {[
                { scene: "暴雨中的废弃码头。狂虎赤裸上身对着集装箱一拳轰出，箱子凹陷变形。", sfx: "🌩️ 雷声 / 狂虎：吼——！！还不够！" },
                { scene: "阴影中，幽影缓缓浮现，手里剑在指尖旋转。", sfx: "⚔️ 金属摩擦声 / 幽影：你的怒火，太吵了。" },
                { scene: "两人交手。狂虎重拳势大力沉；幽影身法鬼魅，残影重重。", sfx: "🥁 极快打击音效，类似鼓点" },
                { scene: "狂虎抓住幽影，猛地砸向地面。幽影却在触地瞬间化作烟雾。", sfx: "🐯 狂虎：躲躲藏藏的小子！" },
                { scene: "幽影从狂虎的影子中刺出匕首，停在喉咙前。狂虎的拳头也停在了幽影的太阳穴旁。", sfx: "🎵 僵持的紧张BGM" },
                { scene: "两人对视，血条归零的UI特效闪过。", sfx: "🔊 系统音：KO！" },
              ].map(function(item, i) {
                return (
                  <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 1, p: 1.5, borderRadius: 2, background: "rgba(255,255,255,0.03)" }}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontWeight: 700, minWidth: 20 }}>{i + 1}</Typography>
                    <Box>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.78rem" }}>{item.scene}</Typography>
                      <Typography variant="caption" sx={{ color: "#00D4FF", fontSize: "0.65rem" }}>{item.sfx}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>

          <Card sx={{ background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "#FFD700", fontWeight: 700, mb: 1.5 }}>📢 游戏 Slogan</Typography>
              <Typography variant="subtitle2" sx={{ color: "#00D4FF", mb: 0.5 }}>简体中文</Typography>
              {GAME_INFO.sloganZH.map(function(s, i) {
                return <Typography key={i} variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.3, fontSize: "0.8rem" }}>· {s}</Typography>;
              })}
              <Typography variant="subtitle2" sx={{ color: "#9B59B6", mt: 1.5, mb: 0.5 }}>English</Typography>
              {GAME_INFO.sloganEN.map(function(s, i) {
                return <Typography key={i} variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.3, fontSize: "0.8rem" }}>· {s}</Typography>;
              })}
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Chip label={GAME_INFO.status} size="small" sx={{ background: "rgba(255,107,53,0.2)", color: "#FF6B35", fontWeight: 700 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
      {tab === 2 && (
        <Box>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, background: "linear-gradient(135deg, #FF6B35, #9B59B6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              🎬 宣传片 & 游戏设定
            </Typography>
          </Box>

          <Card sx={{ mb: 4, background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "#FF6B35", fontWeight: 700, mb: 2 }}>🔥 主宣传片文案</Typography>
              <Box sx={{ borderLeft: "2px solid rgba(255,107,53,0.3)", pl: 2, mb: 2 }}>
                <Typography variant="caption" sx={{ display: "block", color: "rgba(255,255,255,0.4)", mb: 0.5, fontSize: "0.6rem" }}>[开场]</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5, fontSize: "0.8rem" }}>画面漆黑，只有一声沉闷的心跳声。咚……咚……咚…… 一道裂痕划破黑暗，火焰与雷电从中迸发。</Typography>
                <Typography variant="body2" sx={{ color: "#9B59B6", mt: 1, mb: 0.5, fontSize: "0.85rem", fontWeight: 600 }}>旁白（低沉、有磁性）：</Typography>
                <Typography variant="body2" sx={{ color: "#FFD700", mb: 0.3, fontSize: "0.8rem" }}>"在这个世界，力量决定一切。"</Typography>
                <Typography variant="body2" sx={{ color: "#FFD700", mb: 0.3, fontSize: "0.8rem" }}>"有人说，格斗是野蛮人的运动。但他们错了。"</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mt: 1, mb: 0.5, fontSize: "0.8rem" }}>一位身着唐装的武者，周身环绕着蓝色的波动气。对面，一个机械改造人像坦克一样碾压而来。</Typography>
                <Typography variant="body2" sx={{ color: "#FFD700", mb: 0.3, fontSize: "0.8rem" }}>"这不仅仅是肌肉的交锋。这是意志的碰撞。是打破宿命的唯一方式。"</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5, fontSize: "0.8rem" }}>两人对冲，拳头与拳套相抵。静止一秒。</Typography>
                <Typography variant="body2" sx={{ color: "#00FF88", fontWeight: 800, fontSize: "1.2rem", textAlign: "center", my: 1.5 }}>轰——！！！</Typography>
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "#FF6B35" }}>{GAME_INFO.title}</Typography>
                  <Typography variant="body1" sx={{ color: "#FFD700", mt: 1 }}>2026年，全球公测。你，敢来挑战吗？</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 4, background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "#6366F1", fontWeight: 700, mb: 2 }}>🎬 角色预告片：「狂虎」VS「幽影」</Typography>
              {[
                { scene: "暴雨中的废弃码头。狂虎赤裸上身对着集装箱一拳轰出，箱子凹陷变形。", sfx: "🌩️ 雷声 / 狂虎：吼——！！还不够！" },
                { scene: "阴影中，幽影缓缓浮现，手里剑在指尖旋转。", sfx: "⚔️ 金属摩擦声 / 幽影：你的怒火，太吵了。" },
                { scene: "两人交手。狂虎重拳势大力沉；幽影身法鬼魅，残影重重。", sfx: "🥁 极快打击音效，类似鼓点" },
                { scene: "狂虎抓住幽影，猛地砸向地面。幽影却在触地瞬间化作烟雾。", sfx: "🐯 狂虎：躲躲藏藏的小子！" },
                { scene: "幽影从狂虎的影子中刺出匕首，停在喉咙前。狂虎的拳头也停在了幽影的太阳穴旁。", sfx: "🎵 僵持的紧张BGM" },
                { scene: "两人对视，血条归零的UI特效闪过。", sfx: "🔊 系统音：KO！" },
              ].map(function(item, i) {
                return (
                  <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 1, p: 1.5, borderRadius: 2, background: "rgba(255,255,255,0.03)" }}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontWeight: 700, minWidth: 20 }}>{i + 1}</Typography>
                    <Box>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.78rem" }}>{item.scene}</Typography>
                      <Typography variant="caption" sx={{ color: "#00D4FF", fontSize: "0.65rem" }}>{item.sfx}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </CardContent>
          </Card>

          <Card sx={{ background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: "#FFD700", fontWeight: 700, mb: 1.5 }}>📢 游戏 Slogan</Typography>
              <Typography variant="subtitle2" sx={{ color: "#00D4FF", mb: 0.5 }}>简体中文</Typography>
              {GAME_INFO.sloganZH.map(function(s, i) {
                return <Typography key={i} variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.3, fontSize: "0.8rem" }}>· {s}</Typography>;
              })}
              <Typography variant="subtitle2" sx={{ color: "#9B59B6", mt: 1.5, mb: 0.5 }}>English</Typography>
              {GAME_INFO.sloganEN.map(function(s, i) {
                return <Typography key={i} variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 0.3, fontSize: "0.8rem" }}>· {s}</Typography>;
              })}
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Chip label={GAME_INFO.status} size="small" sx={{ background: "rgba(255,107,53,0.2)", color: "#FF6B35", fontWeight: 700 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
      {tab === 3 && (
        <PvPMode />
      )}
    </Container>
  );
}

/* ============================================================
   本地双人对战组件
   ============================================================ */

/* 双人操作按键映射：
   P1（玩家1，字母区）：
     W/A/S/D - 轻击/重击/防御/技能
     Space（空格） - 超必杀
   P2（玩家2，数字键盘区）：
     num4/num5/num6/num8 - 轻击/重击/防御/技能
     num0（小键盘0） - 超必杀
*/

const P1_KEYS = {
  light: "KeyA",     // A - 轻击
  heavy: "KeyS",     // S - 重击
  block: "KeyD",     // D - 防御
  special: "KeyW",   // W - 技能
  ultra: "Space",    // 空格 - 超必杀
};

const P2_KEYS = {
  light: "Numpad4",  // 4 - 轻击
  heavy: "Numpad5",  // 5 - 重击
  block: "Numpad6",  // 6 - 防御
  special: "Numpad8",// 8 - 技能
  ultra: "Numpad0",  // 0 - 超必杀
};

const P1_LABELS = { light: "A", heavy: "S", block: "D", special: "W", ultra: "空格" };
const P2_LABELS = { light: "小4", heavy: "小5", block: "小6", special: "小8", ultra: "小0" };

function getActionFromKey(keyCode, keyMap) {
  for (var id in keyMap) {
    if (keyMap[id] === keyCode) {
      for (var i = 0; i < ACTION_TYPES.length; i++) {
        if (ACTION_TYPES[i].id === id) return ACTION_TYPES[i];
      }
    }
  }
  return null;
}

function PvPArena({ p1, p2, p1Act, p2Act, result }) {
  return (
    <Box sx={{ position: "relative", width: "100%", height: 280, borderRadius: 3, overflow: "hidden", mb: 2,
      background: "linear-gradient(180deg, #0a0a2e, #1a0a3e, #0a0a1e)",
      border: "1px solid " + (result ? "#FFD700" : "rgba(255,255,255,0.08)") }}>
      <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
        background: "linear-gradient(0deg, rgba(0,212,255,0.05), transparent)",
        borderTop: "1px solid rgba(0,212,255,0.15)" }} />
      <Box sx={{ position: "absolute", top: 10, left: 14, color: "rgba(0,212,255,0.15)", fontSize: "0.5rem", fontFamily: "monospace" }}>
        LOCAL VS · 2P
      </Box>
      {result && (
        <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 5, textAlign: "center" }}>
          <Typography variant="h2" sx={{ fontWeight: 900, color: result === "p1win" ? "#00D4FF" : "#FF6B35",
            textShadow: result === "p1win" ? "0 0 40px rgba(0,212,255,0.6)" : "0 0 40px rgba(255,107,53,0.6)", letterSpacing: 8 }}>
            {result === "p1win" ? "P1 WIN!" : "P2 WIN!"}
          </Typography>
        </Box>
      )}
      <Box sx={{ position: "absolute", bottom: 50, left: "15%", textAlign: "center", zIndex: 2, opacity: result === "p2win" ? 0.4 : 1 }}>
        <Box sx={{ fontSize: "3rem" }}>{p1 ? p1.emoji : "🥋"}</Box>
        <Typography variant="caption" sx={{ color: p1 ? p1.accent : "#00D4FF", fontWeight: 700, display: "block", fontSize: "0.6rem" }}>{p1 ? "P1 " + p1.name : "P1"}</Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", display: "block", fontSize: "0.5rem" }}>WASD+空格</Typography>
      </Box>
      {p1Act && !result && (
        <Box sx={{ position: "absolute", bottom: 100, left: "5%", zIndex: 3 }}>
          <Chip label={p1Act} size="small" sx={{ background: "rgba(0,212,255,0.25)", color: "#00D4FF", fontWeight: 700, fontSize: "0.6rem", border: "1px solid rgba(0,212,255,0.4)" }} />
        </Box>
      )}
      {!result && <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "1.6rem", fontWeight: 900, color: "rgba(255,215,0,0.3)", letterSpacing: 4, zIndex: 1 }}>VS</Box>}
      <Box sx={{ position: "absolute", bottom: 50, right: "15%", textAlign: "center", zIndex: 2, opacity: result === "p1win" ? 0.4 : 1 }}>
        <Box sx={{ fontSize: "3rem" }}>{p2 ? p2.emoji : "👹"}</Box>
        <Typography variant="caption" sx={{ color: p2 ? p2.accent : "#FF6B35", fontWeight: 700, display: "block", fontSize: "0.6rem" }}>{p2 ? "P2 " + p2.name : "P2"}</Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", display: "block", fontSize: "0.5rem" }}>小4568+0</Typography>
      {p2Act && !result && (
        <Box sx={{ position: "absolute", bottom: 100, right: "5%", zIndex: 3 }}>
          <Chip label={p2Act} size="small" sx={{ background: "rgba(255,107,53,0.25)", color: "#FF6B35", fontWeight: 700, fontSize: "0.6rem", border: "1px solid rgba(255,107,53,0.4)" }} />
        </Box>
      )}
    </Box>
  );
    </Box>
  );
}
  var [p1Char, setP1Char] = useState(null);
  var [p2Char, setP2Char] = useState(null);
  var [started, setStarted] = useState(false);
  var [p1hp, setP1hp] = useState(0);
  var [p2hp, setP2hp] = useState(0);
  var [p1sp, setP1sp] = useState(0);
  var [p2sp, setP2sp] = useState(0);
  var [p1Act, setP1Act] = useState("");
  var [p2Act, setP2Act] = useState("");
  var [result, setResult] = useState("");
  var [log, setLog] = useState([]);
  var [cooldown, setCooldown] = useState(false);
  var [flash, setFlash] = useState(""); // "p1" or "p2" for damage flash
  var logEndRef = useRef(null);

  var addLog = function(m) { setLog(function(prev) { return prev.concat(m).slice(-99); }); };
  useEffect(function() { if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [log]);

  // Keyboard handler
  useEffect(function() {
    function handleKeyDown(e) {
      if (!started || result) return;
      if (cooldown) return;
      var p1ActFound = getActionFromKey(e.code, P1_KEYS);
      var p2ActFound = getActionFromKey(e.code, P2_KEYS);
      if (!p1ActFound && !p2ActFound) return;
      e.preventDefault();

      var newP1hp = p1hp;
      var newP2hp = p2hp;
      var newP1sp = p1sp;
      var newP2sp = p2sp;

      if (p1ActFound) {
        var canUse = p1ActFound.id === "ultra" ? p1sp >= 100 : p1ActFound.id === "special" ? p1sp >= 25 : true;
        if (!canUse) return;
        var pr = calcDamage(p1Char, p2Char, p1ActFound);
        var spCost = p1ActFound.id === "special" ? 25 : p1ActFound.id === "ultra" ? 100 : 0;
        newP2hp = Math.max(0, p2hp - pr.dmg);
        newP1sp = Math.min(100, p1sp - spCost + pr.spiritGain);
        setP1Act(p1ActFound.icon + " " + p1ActFound.label + (pr.crit ? " 💥会心!" : ""));
        if (pr.dmg > 0) { setFlash("p2"); addLog("⚔️ P1 使出【" + p1ActFound.label + "】造成 " + pr.dmg + (pr.crit ? "（会心！）" : "")); }
        else { addLog("🛡️ P1 防御姿态，气力 +" + pr.spiritGain); }
      }

      if (p2ActFound) {
        var canUse2 = p2ActFound.id === "ultra" ? p2sp >= 100 : p2ActFound.id === "special" ? p2sp >= 25 : true;
        if (!canUse2) return;
        var p2r = calcDamage(p2Char, p1Char, p2ActFound);
        var spCost2 = p2ActFound.id === "special" ? 25 : p2ActFound.id === "ultra" ? 100 : 0;
        newP1hp = Math.max(0, p1hp - p2r.dmg);
        newP2sp = Math.min(100, p2sp - spCost2 + p2r.spiritGain);
        setP2Act(p2ActFound.icon + " " + p2ActFound.label + (p2r.crit ? " 💥会心!" : ""));
        if (p2r.dmg > 0) { setFlash("p1"); addLog("⚔️ P2 使出【" + p2ActFound.label + "】造成 " + p2r.dmg + (p2r.crit ? "（会心！）" : "")); }
        else { addLog("🛡️ P2 防御姿态，气力 +" + p2r.spiritGain); }
      }

      if (p1ActFound && !p2ActFound) {
        setP2hp(newP2hp);
        setP1sp(newP1sp);
      } else if (p2ActFound && !p1ActFound) {
        setP1hp(newP1hp);
        setP2sp(newP2sp);
      } else {
        setP1hp(newP1hp);
        setP2hp(newP2hp);
        setP1sp(newP1sp);
        setP2sp(newP2sp);
      }

      setCooldown(true);
      setTimeout(function() {
        setCooldown(false);
        setFlash("");
      }, 300);

      if (newP1hp <= 0) {
        setResult("p2win");
        addLog("🏆 P2 胜利！");
        return;
      }
      if (newP2hp <= 0) {
        setResult("p1win");
        addLog("🏆 P1 胜利！");
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return function() { window.removeEventListener("keydown", handleKeyDown); };
  }, [started, result, cooldown, p1hp, p2hp, p1sp, p2sp, p1Char, p2Char, addLog]);

  function startPvP() {
    if (!p1Char || !p2Char) return;
    setP1hp(p1Char.hp);
    setP2hp(p2Char.hp);
    setP1sp(20);
    setP2sp(20);
    setLog([]);
    setResult("");
    setP1Act("");
    setP2Act("");
    setStarted(true);
    setCooldown(false);
    setFlash("");
    addLog("🥊 本地对战开始！P1 " + p1Char.name + " VS P2 " + p2Char.name);
  }

  function resetPvP() {
    setStarted(false);
    setResult("");
    setP1hp(0);
    setP2hp(0);
    setP1sp(0);
    setP2sp(0);
    setP1Act("");
    setP2Act("");
    setLog([]);
  }

  /* 操作说明浮层 */
  function renderControlsHelp() {
    return (
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Card sx={{ flex: 1, background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 2 }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="caption" sx={{ color: "#00D4FF", fontWeight: 700, display: "block", mb: 0.5, fontSize: "0.7rem" }}>
              🎮 P1（字母区）
            </Typography>
            <Grid container spacing={0.5}>
              {ACTION_TYPES.map(function(act) {
                var label = P1_LABELS[act.id];
                if (act.id === "ultra") label = "空格";
                return (
                  <Grid item xs={12} key={act.id}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem", display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ display: "inline-block", background: "rgba(0,212,255,0.15)", color: "#00D4FF", px: 0.8, py: 0.1, borderRadius: 0.5, fontSize: "0.55rem", fontWeight: 700, minWidth: 30, textAlign: "center" }}>
                        {label}
                      </Box>
                      = {act.icon} {act.label}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: "rgba(255,107,53,0.05)", border: "1px solid rgba(255,107,53,0.15)", borderRadius: 2 }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="caption" sx={{ color: "#FF6B35", fontWeight: 700, display: "block", mb: 0.5, fontSize: "0.7rem" }}>
              🎮 P2（小键盘区）
            </Typography>
            <Grid container spacing={0.5}>
              {ACTION_TYPES.map(function(act) {
                return (
                  <Grid item xs={12} key={act.id}>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.6rem", display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box sx={{ display: "inline-block", background: "rgba(255,107,53,0.15)", color: "#FF6B35", px: 0.8, py: 0.1, borderRadius: 0.5, fontSize: "0.55rem", fontWeight: 700, minWidth: 30, textAlign: "center" }}>
                        {P2_LABELS[act.id]}
                      </Box>
                      = {act.icon} {act.label}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, background: "linear-gradient(135deg, #00D4FF, #FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", mb: 0.5 }}>
          🎮 本地双人对战
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
          同一台电脑，P1 用字母区（WASD+空格），P2 用小键盘（4568+0）
        </Typography>
      </Box>

      {!started && renderControlsHelp()}

      {/* 角色选择 */}
      <Typography variant="subtitle2" sx={{ mb: 1, color: "#00D4FF", fontWeight: 700 }}>⬅️ P1 选角色</Typography>
      <Grid container spacing={1} sx={{ mb: 1.5 }}>
        {CHARACTERS.map(function(c) {
          var sel = p1Char && p1Char.id === c.id;
          return (
            <Grid item xs={6} sm={3} key={"p1-" + c.id}>
              <Card onClick={function() { setP1Char(c); if (started) resetPvP(); }}
                sx={{ cursor: "pointer", background: c.bg, border: sel ? "2px solid " + c.accent : "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s", "&:hover": { transform: "translateY(-2px)", borderColor: c.accent } }}>
                <CardContent sx={{ p: 1, textAlign: "center" }}>
                  <Box sx={{ fontSize: "1.8rem" }}>{c.emoji}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: c.accent, fontSize: "0.6rem" }}>{c.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Typography variant="subtitle2" sx={{ mb: 1, color: "#FF6B35", fontWeight: 700 }}>➡️ P2 选角色</Typography>
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {CHARACTERS.map(function(c) {
          var sel = p2Char && p2Char.id === c.id;
          return (
            <Grid item xs={6} sm={3} key={"p2-" + c.id}>
              <Card onClick={function() { setP2Char(c); if (started) resetPvP(); }}
                sx={{ cursor: "pointer", background: c.bg, border: sel ? "2px solid " + c.accent : "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s", "&:hover": { transform: "translateY(-2px)", borderColor: c.accent } }}>
                <CardContent sx={{ p: 1, textAlign: "center" }}>
                  <Box sx={{ fontSize: "1.8rem" }}>{c.emoji}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: c.accent, fontSize: "0.6rem" }}>{c.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {!started ? (
        <Box sx={{ textAlign: "center", my: 2 }}>
          <Button variant="contained" size="large" onClick={startPvP}
            disabled={!p1Char || !p2Char}
            startIcon={<WhatshotIcon />}
            sx={{ background: "linear-gradient(135deg, #00D4FF, #FF6B35)", fontSize: "1rem", px: 5, py: 1.3, borderRadius: 3,
              "&:hover": { background: "linear-gradient(135deg, #00E5FF, #FF8C5E)" },
              "&:disabled": { background: "rgba(255,255,255,0.1)" } }}>
            🔥 开始对战！
          </Button>
        </Box>
      ) : (
        <Box>
          <Grid container spacing={1} sx={{ mb: 1 }}>
            <Grid item xs={6}>
              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.2 }}>
                  <Typography variant="caption" sx={{ color: p1Char.accent, fontWeight: 700, fontSize: "0.7rem" }}>P1 {p1Char.name}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{p1hp}/{p1Char.hp}</Typography>
                </Box>
                <Box sx={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <Box sx={{ height: "100%", width: Math.max(0, (p1hp / p1Char.hp) * 100) + "%",
                    background: p1hp > p1Char.hp * 0.3 ? "linear-gradient(90deg, #00D4FF, #00FF88)" : "linear-gradient(90deg, #FF6B35, #E74C3C)",
                    borderRadius: 5, transition: "width 0.3s ease",
                    boxShadow: flash === "p1" ? "0 0 10px rgba(255,0,0,0.5)" : "none" }} />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: "right" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.2 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{p2hp}/{p2Char.hp}</Typography>
                  <Typography variant="caption" sx={{ color: p2Char.accent, fontWeight: 700, fontSize: "0.7rem" }}>P2 {p2Char.name}</Typography>
                </Box>
                <Box sx={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <Box sx={{ height: "100%", width: Math.max(0, (p2hp / p2Char.hp) * 100) + "%", float: "right",
                    background: p2hp > p2Char.hp * 0.3 ? "linear-gradient(90deg, #00FF88, #00D4FF)" : "linear-gradient(90deg, #E74C3C, #FF6B35)",
                    borderRadius: 5, transition: "width 0.3s ease",
                    boxShadow: flash === "p2" ? "0 0 10px rgba(255,0,0,0.5)" : "none" }} />
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Grid container spacing={1} sx={{ mb: 1 }}>
            <Grid item xs={6}><Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: "#FFD700", fontSize: "0.6rem" }}>气力</Typography>
              <Box sx={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden", maxWidth: 100 }}>
                <Box sx={{ height: "100%", width: (p1sp / 100) * 100 + "%",
                  background: p1sp >= 100 ? "linear-gradient(90deg, #FFD700, #FF6B35)" : "linear-gradient(90deg, #6366F1, #00D4FF)",
                  borderRadius: 3, transition: "width 0.3s" }} />
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.55rem" }}>{p1sp}</Typography>
            </Box></Grid>
            <Grid item xs={6}><Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "flex-end" }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.55rem" }}>{p2sp}</Typography>
              <Box sx={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden", maxWidth: 100 }}>
                <Box sx={{ height: "100%", width: (p2sp / 100) * 100 + "%", float: "right",
                  background: p2sp >= 100 ? "linear-gradient(90deg, #FFD700, #FF6B35)" : "linear-gradient(90deg, #6366F1, #00D4FF)",
                  borderRadius: 3, transition: "width 0.3s" }} />
              </Box>
            </Box></Grid>
          </Grid>

          <PvPArena p1={p1Char} p2={p2Char} p1Act={p1Act} p2Act={p2Act} result={result} />

          {result ? (
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Typography variant="h6" sx={{ mb: 1, color: result === "p1win" ? "#00D4FF" : "#FF6B35", fontWeight: 800 }}>
                {result === "p1win" ? "🏆 P1 胜利！" : "🏆 P2 胜利！"}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}>
                <Button variant="outlined" onClick={startPvP} startIcon={<RedoIcon />} sx={{ borderColor: "#00D4FF", color: "#00D4FF", borderRadius: 2 }}>再来一局</Button>
                <Button variant="outlined" onClick={resetPvP} sx={{ borderColor: "rgba(255,255,255,0.2)", color: "text.secondary", borderRadius: 2 }}>换角色</Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", mb: 1 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                {cooldown ? "⚡ 冷却中..." : "⌨️ P1按字母键 / P2按小键盘出招"}
              </Typography>
            </Box>
          )}

          <Card sx={{ mt: 2, background: "rgba(10,10,30,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardContent sx={{ p: 1.5, maxHeight: 120, overflow: "auto" }}>
              <Typography variant="caption" sx={{ color: "#FFD700", fontWeight: 700, display: "block", mb: 0.5 }}>📋 战报</Typography>
              {log.map(function(m, i) {
                return <Typography key={i} variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.6rem", lineHeight: 1.6 }}>{m}</Typography>;
              })}
              <div ref={logEndRef} />
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
