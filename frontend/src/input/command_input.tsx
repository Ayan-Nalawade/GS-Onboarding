import { useEffect, useState } from "react";
import { CommandResponse, MainCommandResponse } from "../data/response"
import { createCommand, getMainCommands } from "./input_api";
import "./command_input.css"

interface CommandInputProp {
  setCommands: React.Dispatch<React.SetStateAction<CommandResponse[]>>
}

const CommandInput = ({ setCommands }: CommandInputProp) => {
  const [mainCommands, setMainCommands] = useState<MainCommandResponse[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<MainCommandResponse | null>(null);
  const [parameters, setParameters] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const getMainCommandsFn = async () => {
      try {
        const data = await getMainCommands();
        setMainCommands(data.data)
      } catch (error) {
        console.error(error)
        alert("Error fetching main commands")
      }
    }

    getMainCommandsFn();
  }, [])

  const handleParameterChange = (param: string, value: string): void => {
    setParameters((prev) => ({
      ...prev,
      [param]: value,
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommand) {
      alert("Please select a command")
      return
    }

    try {
      const params = selectedCommand.params?.split(",").map(p => parameters[p]).join(",") || null;
      const res = await createCommand({ command_type: selectedCommand.id, params: params })
      setCommands(prev => [...prev, res.data])
      setParameters({})
    } catch (error) {
      console.error(error)
      alert("Error creating command")
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="spreader">
          <div>
            <label>Command Type: </label>
            <select onChange={(e) => setSelectedCommand(mainCommands.find(c => c.id === parseInt(e.target.value)) || null)}>
              <option value="">Select a command</option>
              {mainCommands.map(command => (
                <option key={command.id} value={command.id}>{command.name}</option>
              ))}
            </select>
          </div>
          {selectedCommand?.params?.split(",").map((param) => (
            <div key={param}>
              <label htmlFor={`param-${param}`}>{param}: </label>
              <input
                id={`param-${param}`}
                type="text"
                value={parameters[param] || ""}
                onChange={(e) => handleParameterChange(param, e.target.value)}
                placeholder={`Enter ${param}`}
              />
            </div>
          ))}
          <button type="submit">Submit</button>
        </div>
      </form>
    </>
  )
}

export default CommandInput;