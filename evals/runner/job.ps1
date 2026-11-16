# Job Object do Windows com KILL_ON_JOB_CLOSE, para encerrar uma tentativa encerrar a árvore inteira, inclusive o
# servidor que continua na porta depois que o shell que o abriu fechou (um processo órfão continua no job).
# Uso, por evals/runner/job.ts: uma linha por comando na entrada padrão, uma linha de resposta na saída.
#   atribuir <pid>  põe o processo no job; o que ele abrir depois entra junto
#   pids            lista os processos vivos do job
#   encerrar        mata todos e fecha o job; a entrada fechada faz o mesmo
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

public static class JobDaTentativa {
  [StructLayout(LayoutKind.Sequential)]
  struct LimiteBasico {
    public long PerProcessUserTimeLimit;
    public long PerJobUserTimeLimit;
    public uint LimitFlags;
    public UIntPtr MinimumWorkingSetSize;
    public UIntPtr MaximumWorkingSetSize;
    public uint ActiveProcessLimit;
    public UIntPtr Affinity;
    public uint PriorityClass;
    public uint SchedulingClass;
  }
  [StructLayout(LayoutKind.Sequential)]
  struct ContadoresIo { public ulong A, B, C, D, E, F; }
  [StructLayout(LayoutKind.Sequential)]
  struct LimiteEstendido {
    public LimiteBasico Basico;
    public ContadoresIo Io;
    public UIntPtr ProcessMemoryLimit;
    public UIntPtr JobMemoryLimit;
    public UIntPtr PeakProcessMemoryUsed;
    public UIntPtr PeakJobMemoryUsed;
  }
  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern IntPtr CreateJobObject(IntPtr atributos, string nome);
  [DllImport("kernel32.dll", SetLastError = true)]
  static extern bool SetInformationJobObject(IntPtr job, int classe, ref LimiteEstendido info, uint tamanho);
  [DllImport("kernel32.dll", SetLastError = true)]
  static extern bool AssignProcessToJobObject(IntPtr job, IntPtr processo);
  [DllImport("kernel32.dll", SetLastError = true)]
  static extern IntPtr OpenProcess(uint acesso, bool herdar, uint pid);
  [DllImport("kernel32.dll", SetLastError = true)]
  static extern bool CloseHandle(IntPtr h);
  [DllImport("kernel32.dll", SetLastError = true)]
  static extern bool TerminateJobObject(IntPtr job, uint codigo);
  [DllImport("kernel32.dll", SetLastError = true)]
  static extern bool QueryInformationJobObject(IntPtr job, int classe, IntPtr info, uint tamanho, IntPtr devolvido);

  public static IntPtr Criar() {
    IntPtr job = CreateJobObject(IntPtr.Zero, null);
    if (job == IntPtr.Zero) throw new Win32Exception();
    var info = new LimiteEstendido();
    info.Basico.LimitFlags = 0x2000;
    if (!SetInformationJobObject(job, 9, ref info, (uint)Marshal.SizeOf(typeof(LimiteEstendido)))) throw new Win32Exception();
    return job;
  }

  public static void Atribuir(IntPtr job, uint pid) {
    IntPtr processo = OpenProcess(0x0100 | 0x0001, false, pid);
    if (processo == IntPtr.Zero) throw new Win32Exception();
    try {
      if (!AssignProcessToJobObject(job, processo)) throw new Win32Exception();
    } finally {
      CloseHandle(processo);
    }
  }

  public static ulong[] Pids(IntPtr job) {
    int tamanho = 16 + 8 * 8192;
    IntPtr buffer = Marshal.AllocHGlobal(tamanho);
    try {
      if (!QueryInformationJobObject(job, 3, buffer, (uint)tamanho, IntPtr.Zero)) throw new Win32Exception();
      int n = Marshal.ReadInt32(buffer, 4);
      var lista = new ulong[n];
      for (int i = 0; i < n; i++) lista[i] = (ulong)Marshal.ReadInt64(buffer, 8 + i * 8);
      return lista;
    } finally {
      Marshal.FreeHGlobal(buffer);
    }
  }

  public static void Encerrar(IntPtr job) {
    TerminateJobObject(job, 1);
    CloseHandle(job);
  }
}
'@

$job = [JobDaTentativa]::Criar()
[Console]::Out.WriteLine('pronto')
[Console]::Out.Flush()
$continuar = $true
while ($continuar) {
  $linha = [Console]::In.ReadLine()
  if ($null -eq $linha) { break }
  $partes = $linha.Trim().Split(' ')
  try {
    switch ($partes[0]) {
      'atribuir' { [JobDaTentativa]::Atribuir($job, [uint32]$partes[1]); [Console]::Out.WriteLine('ok') }
      'pids' { [Console]::Out.WriteLine('pids ' + ([JobDaTentativa]::Pids($job) -join ',')) }
      'encerrar' { $continuar = $false; [Console]::Out.WriteLine('ok') }
      default { [Console]::Out.WriteLine('erro comando desconhecido') }
    }
  } catch {
    [Console]::Out.WriteLine('erro ' + $_.Exception.Message)
  }
  [Console]::Out.Flush()
}
[JobDaTentativa]::Encerrar($job)
