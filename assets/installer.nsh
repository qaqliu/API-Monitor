!include nsDialogs.nsh

Var CreateDesktopShortcutCheckbox
Var CreateDesktopShortcutChoice

; Set default install directory to avoid double-nesting
!macro customInit
  StrCpy $CreateDesktopShortcutChoice "1"
  ${IfNot} ${isUpdated}
    StrCpy $INSTDIR "$PROGRAMFILES64\API Monitor"
  ${EndIf}
!macroend

!macro customPageAfterChangeDir
  PageEx custom
    PageCallbacks DesktopShortcutPageShow DesktopShortcutPageLeave
    Caption "Additional Options"
  PageExEnd
!macroend

!ifndef BUILD_UNINSTALLER
Function DesktopShortcutPageShow
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0u 0u 100% 24u "Choose additional options for API Monitor."
  Pop $0

  ${NSD_CreateCheckbox} 0u 34u 100% 16u "Create desktop shortcut"
  Pop $CreateDesktopShortcutCheckbox

  ${If} $CreateDesktopShortcutChoice == "1"
    SendMessage $CreateDesktopShortcutCheckbox ${BM_SETCHECK} ${BST_CHECKED} 0
  ${EndIf}

  nsDialogs::Show
FunctionEnd

Function DesktopShortcutPageLeave
  SendMessage $CreateDesktopShortcutCheckbox ${BM_GETCHECK} 0 0 $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $CreateDesktopShortcutChoice "1"
  ${Else}
    StrCpy $CreateDesktopShortcutChoice "0"
  ${EndIf}
FunctionEnd
!endif

; Auto-append "API Monitor" when user browses to a directory that doesn't already end with it
Function .onVerifyInstDir
  StrCmp $INSTDIR "" done

  StrCpy $1 $INSTDIR
  StrLen $0 $1

  find_bs:
    IntOp $0 $0 - 1
    IntCmp $0 -1 append
    StrCpy $2 $1 1 $0
    StrCmp $2 "\" check_tail find_bs

  check_tail:
    IntOp $0 $0 + 1
    StrCpy $2 $1 "" $0
    StrCmp $2 "API Monitor" done

  append:
    StrCpy $INSTDIR "$INSTDIR\API Monitor"

  done:
FunctionEnd

; Create desktop shortcut after all files are installed (exe + icon both available)
!macro customInstall
  ${If} $CreateDesktopShortcutChoice == "1"
    FileOpen $0 "$TEMP\create_shortcut.vbs" w
    FileWrite $0 "Set ws = CreateObject($\"WScript.Shell$\")$\r$\n"
    FileWrite $0 "Set s = ws.CreateShortcut($\"$DESKTOP\API Monitor.lnk$\")$\r$\n"
    FileWrite $0 "s.TargetPath = $\"$INSTDIR\API Monitor.exe$\"$\r$\n"
    FileWrite $0 "s.IconLocation = $\"$INSTDIR\API Monitor.exe$\" & $\",0$\"$\r$\n"
    FileWrite $0 "s.Save()$\r$\n"
    FileClose $0
    nsExec::ExecToLog 'cscript.exe //nologo "$TEMP\create_shortcut.vbs"'
    Delete "$TEMP\create_shortcut.vbs"
  ${EndIf}
!macroend

; Kill app and close Explorer before uninstall so files can be deleted
!macro customUnInstall
  SetOutPath "$TEMP"
  nsExec::ExecToStack 'taskkill /f /im "API Monitor.exe"'
  Pop $0
  Sleep 1500
  ; Close Explorer windows showing the install folder so it can be deleted
  FileOpen $0 "$TEMP\close_explorer.vbs" w
  FileWrite $0 "On Error Resume Next$\r$\n"
  FileWrite $0 "Set sa = CreateObject($\"Shell.Application$\")$\r$\n"
  FileWrite $0 "For Each w In sa.Windows$\r$\n"
  FileWrite $0 "  If LCase(w.Document.Folder.Self.Path) = LCase($\"$INSTDIR$\") Then$\r$\n"
  FileWrite $0 "    w.Quit$\r$\n"
  FileWrite $0 "  End If$\r$\n"
  FileWrite $0 "Next$\r$\n"
  FileClose $0
  nsExec::ExecToLog 'cscript.exe //nologo "$TEMP\close_explorer.vbs"'
  Delete "$TEMP\close_explorer.vbs"
  Sleep 1000
  Delete "$DESKTOP\API Monitor.lnk"
  RMDir /r "$PROFILE\AppData\Roaming\deepseek-api-monitor"
!macroend

; Final cleanup — spawn async VBS to delete install dir after uninstaller exits (no reboot)
!macro customRemoveFiles
  SetOutPath "$TEMP"
  Delete "$DESKTOP\API Monitor.lnk"
  ; Async VBScript waits until the uninstaller exits, retries $INSTDIR, then removes an empty parent "API Monitor" folder left by old double-nested installs.
  FileOpen $0 "$TEMP\api_mon_cleanup.vbs" w
  FileWrite $0 "On Error Resume Next$\r$\n"
  FileWrite $0 "Set fso = CreateObject($\"Scripting.FileSystemObject$\")$\r$\n"
  FileWrite $0 "installDir = $\"$INSTDIR$\"$\r$\n"
  FileWrite $0 "parentDir = fso.GetParentFolderName(installDir)$\r$\n"
  FileWrite $0 "scriptPath = WScript.ScriptFullName$\r$\n"
  FileWrite $0 "WScript.Sleep 5000$\r$\n"
  FileWrite $0 "For i = 1 To 20$\r$\n"
  FileWrite $0 "  If fso.FolderExists(installDir) Then fso.DeleteFolder installDir, True$\r$\n"
  FileWrite $0 "  If Not fso.FolderExists(installDir) Then Exit For$\r$\n"
  FileWrite $0 "  WScript.Sleep 1000$\r$\n"
  FileWrite $0 "Next$\r$\n"
  FileWrite $0 "If fso.FolderExists(parentDir) Then$\r$\n"
  FileWrite $0 "  If LCase(fso.GetFileName(parentDir)) = $\"api monitor$\" Then$\r$\n"
  FileWrite $0 "    Set parent = fso.GetFolder(parentDir)$\r$\n"
  FileWrite $0 "    If parent.Files.Count = 0 And parent.SubFolders.Count = 0 Then fso.DeleteFolder parentDir, True$\r$\n"
  FileWrite $0 "  End If$\r$\n"
  FileWrite $0 "End If$\r$\n"
  FileWrite $0 "fso.DeleteFile scriptPath, True$\r$\n"
  FileClose $0
  ExecShell "open" "wscript.exe" "$TEMP\api_mon_cleanup.vbs" SW_HIDE
  RMDir /r "$PROFILE\AppData\Roaming\deepseek-api-monitor"
!macroend
